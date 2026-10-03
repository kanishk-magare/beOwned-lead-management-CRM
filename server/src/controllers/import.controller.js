const path = require('path');
const fs = require('fs');
const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const readline = require('readline');
const fsPromises = require('fs/promises');
const { leadImportQueue } = require('../workers/importQueue');
const { parseHeaderLine, validateHeaders } = require('../utils/csvHeaderValidator');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.csv';
    cb(null, `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('csv') || file.originalname.toLowerCase().endsWith('.csv') || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Download sample CSV template with standard headers
const downloadSampleCsv = (req, res) => {
  const sampleContent = `name,phone,email,budget,location,propertyType,source,status
Aarav Sharma,9876543210,aarav.sharma@example.com,8500000,"Bandra West, Mumbai",3 BHK,Website,New
Priya Patel,9823456789,priya.patel@example.com,12500000,"Indiranagar, Bangalore",Villa,Referral,Contacted
Rohan Verma,9812345678,rohan.verma@example.com,6500000,"Whitefield, Bangalore",2 BHK,Google,Site Visit
Ananya Desai,9898765432,ananya.desai@example.com,18000000,"Juhu, Mumbai",4+ BHK,Walk-in,Closed
Vikram Malhotra,9845012345,vikram.malhotra@example.com,9500000,"Cyber City, Gurgaon",Commercial,Other,New
`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sample_leads_template.csv"');
  res.send(sampleContent);
};

// Validate uploaded CSV and queue background import job
const uploadCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'No CSV file uploaded' } });
  }

  const filePath = req.file.path;
  console.log(`Processing CSV upload: ${req.file.originalname}`);

  // 1. Asynchronous non-blocking inspection using Streams & readline
  let firstLine = null;
  let dataRowCount = 0;
  let fileStream = null;
  let rl = null;

  try {
    fileStream = fs.createReadStream(filePath);
    rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim().length > 0) {
        if (!firstLine) {
          firstLine = line;
        } else {
          dataRowCount++;
          if (dataRowCount > 500) {
            break;
          }
        }
      }
    }
  } catch (err) {
    await fsPromises.unlink(filePath).catch(() => {});
    return res.status(400).json({ success: false, error: { message: 'Could not read uploaded file' } });
  } finally {
    if (rl) rl.close();
    if (fileStream) fileStream.destroy();
  }

  if (!firstLine || dataRowCount === 0) {
    await fsPromises.unlink(filePath).catch(() => {});
    return res.status(400).json({
      success: false,
      error: { message: 'CSV file is empty or missing data rows' },
    });
  }

  if (dataRowCount > 500) {
    await fsPromises.unlink(filePath).catch(() => {});
    return res.status(400).json({
      success: false,
      error: { message: `File contains more than 500 leads. The maximum allowed is 500 leads per import.` },
    });
  }

  // 2. Strict Header Validation FIRST
  // If any header is missing, misspelled, extra, or incorrect:
  // immediately fail the file, do not queue or process any rows.
  const headers = parseHeaderLine(firstLine);
  const headerValidation = validateHeaders(headers);
  if (!headerValidation.isValid) {
    await fsPromises.unlink(filePath).catch(() => {});
    return res.status(400).json({
      success: false,
      error: { message: headerValidation.message },
    });
  }

  // 2. Add job to BullMQ queue
  const job = await leadImportQueue.add(
    'csv-import',
    {
      filePath,
      originalName: req.file.originalname,
      totalRows: dataRowCount,
    },
    {
      removeOnComplete: false,
      removeOnFail: false,
    }
  );
  console.log(`CSV import queued with job ID: ${job.id}`);

  res.status(202).json({
    success: true,
    data: {
      jobId: job.id,
      status: 'Queued',
      message: 'Upload received / Processing started',
      totalRows: dataRowCount,
      fileName: req.file.originalname,
    },
  });
});

// Check status and progress of an import background job
const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await leadImportQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: { message: `Import job #${jobId} not found` } });
  }

  const state = await job.getState();
  let status = 'Queued';
  if (state === 'active') status = 'Processing';
  else if (state === 'completed') status = 'Completed';
  else if (state === 'failed') status = 'Failed';

  res.json({
    success: true,
    data: {
      jobId: job.id,
      status,
      progress: job.progress || 0,
      totalRows: job.data?.totalRows || 0,
      result: job.returnvalue || null,
      error: job.failedReason || null,
    },
  });
});

// Download generated CSV containing invalid leads and error reasons
const downloadInvalidCsv = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const invalidFileName = `invalid_leads_${jobId}.csv`;
  const invalidPath = path.join(UPLOADS_DIR, invalidFileName);

  if (!fs.existsSync(invalidPath)) {
    return res.status(404).json({ success: false, error: { message: 'No invalid leads file available for this job' } });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="invalid_leads_job_${jobId}.csv"`);
  res.sendFile(invalidPath);
});

module.exports = {
  upload,
  downloadSampleCsv,
  uploadCsv,
  getJobStatus,
  downloadInvalidCsv,
};
