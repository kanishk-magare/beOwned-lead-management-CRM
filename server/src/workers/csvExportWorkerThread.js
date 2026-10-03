const { workerData, parentPort } = require('worker_threads');
const moment = require('moment');

/**
 * Worker Thread for CSV Export Generation
 * Serializes and escapes lead records into CSV format off the main Node.js event loop
 */
function leadsToCsv(leads) {
  const headers = ['name', 'phone', 'email', 'budget', 'location', 'propertyType', 'source', 'status', 'createdAt'];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [headers.join(',')];

  for (const lead of leads) {
    const item = lead.dataValues || lead;
    const formattedCreated = item.createdAt ? moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss') : '';
    const row = [
      escapeCell(item.name),
      escapeCell(item.phone),
      escapeCell(item.email),
      escapeCell(item.budget),
      escapeCell(item.location),
      escapeCell(item.propertyType),
      escapeCell(item.source),
      escapeCell(item.status),
      escapeCell(formattedCreated),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n') + '\r\n';
}

try {
  const leads = workerData?.leads || [];
  const csvContent = leadsToCsv(leads);
  parentPort.postMessage({ success: true, csvContent });
} catch (err) {
  parentPort.postMessage({ success: false, error: err?.message || String(err) });
}
