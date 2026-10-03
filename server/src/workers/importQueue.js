const { Queue, Worker } = require('bullmq');
const { Worker: ThreadWorker } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { redisConnection } = require('../config/redis');
const { Lead } = require('../models');

const QUEUE_NAME = 'lead-csv-import';
const leadImportQueue = new Queue(QUEUE_NAME, { connection: redisConnection });

/**
 * Executes CSV parsing and validation inside a background worker thread
 */
function runWorkerThread(filePath) {
  return new Promise((resolve, reject) => {
    const workerScript = path.resolve(__dirname, 'csvWorkerThread.js');
    const worker = new ThreadWorker(workerScript, {
      workerData: { filePath: path.resolve(filePath) },
    });

    worker.on('message', (msg) => {
      // Ignore Node.js internal --watch messages
      if (msg && msg['watch:require']) return;

      if (msg && msg.success === true) {
        resolve(msg);
      } else if (msg && msg.success === false) {
        reject(new Error(msg.error || 'Worker thread failed to process CSV'));
      }
    });

    worker.on('error', (err) => {
      console.error('[WorkerThread event error]:', err);
      reject(err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error('[WorkerThread exited non-zero]:', code);
        reject(new Error(`Worker thread exited with code ${code}`));
      }
    });
  });
}

/**
 * Helper to write an invalid records CSV with reasons
 */
async function generateInvalidCsv(invalidRows, outputPath) {
  if (!invalidRows || invalidRows.length === 0) return;
  const headers = ['name', 'phone', 'email', 'budget', 'location', 'propertyType', 'source', 'status', 'reason'];
  const escapeCsv = (val) => {
    const str = val === undefined || val === null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];
  for (const row of invalidRows) {
    const line = [
      escapeCsv(row.name),
      escapeCsv(row.phone),
      escapeCsv(row.email),
      escapeCsv(row.budget),
      escapeCsv(row.location),
      escapeCsv(row.propertyType),
      escapeCsv(row.source),
      escapeCsv(row.status),
      escapeCsv(row._failure_reason || row.reason || 'Invalid data'),
    ];
    lines.push(line.join(','));
  }

  await fsPromises.writeFile(outputPath, lines.join('\n'), 'utf8');
}

/**
 * Background BullMQ worker to pick up and process queued CSV import jobs
 */
const importWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { filePath, originalName } = job.data;
    await job.updateProgress(10);

    let parsedResult;
    try {
      // 1. Process CSV in a Worker Thread (offloads CPU parsing from main process)
      parsedResult = await runWorkerThread(filePath);
      await job.updateProgress(40);
    } catch (err) {
      await fsPromises.unlink(filePath).catch(() => {});
      throw err;
    }

    const { validRows, invalidRows, totalCount } = parsedResult;
    let successCount = 0;

    // 2. Insert valid rows into PostgreSQL using Sequelize
    for (const lead of validRows) {
      try {
        await Lead.create(lead);
        successCount++;
      } catch (dbErr) {
        if (dbErr.name === 'SequelizeUniqueConstraintError' || dbErr.code === '23505') {
          const field = Object.keys(dbErr.fields || {})[0] || '';
          const detail = dbErr.detail || '';
          const isPhone = field.includes('phone') || detail.includes('phone');
          const reason = isPhone ? 'Phone already registered' : 'Email already registered';
          invalidRows.push({ ...lead, _failure_reason: reason });
        } else {
          invalidRows.push({ ...lead, _failure_reason: dbErr.message });
        }
      }
    }

    await job.updateProgress(90);

    // 3. If there are invalid rows, save them to a downloadable CSV
    let invalidCsvFileName = null;
    if (invalidRows.length > 0) {
      const uploadsDir = path.dirname(filePath);
      invalidCsvFileName = `invalid_leads_${job.id}.csv`;
      const invalidPath = path.join(uploadsDir, invalidCsvFileName);
      await generateInvalidCsv(invalidRows, invalidPath);
    }

    // 4. Clean up original uploaded file
    await fsPromises.unlink(filePath).catch(() => {});

    await job.updateProgress(100);

    return {
      status: 'Completed',
      totalRows: totalCount,
      successCount,
      insertedCount: successCount,
      invalidCount: invalidRows.length,
      hasInvalid: invalidRows.length > 0,
      invalidCsvFileName,
      originalName,
    };
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process CSV imports sequentially to prevent DB lock contention
  }
);

importWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
  if (job?.data?.filePath) {
    fsPromises.unlink(job.data.filePath).catch(() => {});
  }
});

importWorker.on('completed', (job) => {
  console.log(`[BullMQ Worker] Job ${job.id} completed. Imported ${job.returnvalue?.successCount} leads.`);
});

module.exports = {
  leadImportQueue,
  importWorker,
};
