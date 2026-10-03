const { workerData, parentPort } = require('worker_threads');
const fs = require('fs');
const csv = require('csv-parser');
const { PROPERTY_TYPES, LEAD_SOURCES, LEAD_STATUSES } = require('../config/constants');
const { validateCsvFileHeaders } = require('../utils/csvHeaderValidator');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(\+91)?[6-9]\d{9}$/;

function validateRow(row) {
  const errors = [];

  const name = (row.name || '').trim();
  const rawPhone = (row.phone || '').trim().replace(/[\s-]/g, '');
  const email = (row.email || '').trim().toLowerCase();
  const budget = Number((row.budget || '').toString().trim());
  const location = (row.location || '').trim();
  const propertyType = (row.propertyType || '').trim();
  const source = (row.source || '').trim();
  const status = (row.status || '').trim() || 'New';

  if (!name || name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!rawPhone || !PHONE_RE.test(rawPhone)) {
    errors.push('Invalid 10-digit Indian phone number');
  }

  if (!email || !EMAIL_RE.test(email)) {
    errors.push('Invalid email address');
  }

  if (!Number.isFinite(budget) || budget <= 0) {
    errors.push('Budget must be a positive number');
  }

  if (!location || location.length < 2) {
    errors.push('Location is required');
  }

  if (!PROPERTY_TYPES.includes(propertyType)) {
    errors.push(`Property type must be one of: ${PROPERTY_TYPES.join(', ')}`);
  }

  if (!LEAD_SOURCES.includes(source)) {
    errors.push(`Source must be one of: ${LEAD_SOURCES.join(', ')}`);
  }

  if (status && !LEAD_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${LEAD_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      reason: errors.join('; '),
      raw: row,
    };
  }

  return {
    isValid: true,
    data: {
      name,
      phone: rawPhone.slice(-10),
      email,
      budget,
      location,
      propertyType,
      source,
      status,
    },
  };
}

async function parseAndValidate(filePath) {
  const validRows = [];
  const invalidRows = [];
  let rowCount = 0;

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('[csvWorkerThread Stream Error]:', err);
      reject(err);
    });

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().replace(/^[\uFEFF\xA0]+|[\uFEFF\xA0]+$/g, ''),
        })
      )
      .on('error', (err) => {
        console.error('[csvWorkerThread CSV Parser Error]:', err);
        reject(err);
      })
      .on('data', (rawRow) => {
        rowCount++;
        // Normalize keys (handle case-insensitivity like PropertyType -> propertyType)
        const row = {};
        for (const [key, val] of Object.entries(rawRow)) {
          const lowerKey = key.trim().toLowerCase().replace(/[\s_-]/g, '');
          if (lowerKey === 'name' || lowerKey === 'fullname' || lowerKey === 'clientname') row.name = val;
          else if (lowerKey === 'phone' || lowerKey === 'phonenumber' || lowerKey === 'mobile' || lowerKey === 'contact') row.phone = val;
          else if (lowerKey === 'email' || lowerKey === 'emailaddress') row.email = val;
          else if (lowerKey === 'budget' || lowerKey === 'price') row.budget = val;
          else if (lowerKey === 'location' || lowerKey === 'address' || lowerKey === 'city') row.location = val;
          else if (lowerKey === 'propertytype') row.propertyType = val;
          else if (lowerKey === 'source' || lowerKey === 'leadsource') row.source = val;
          else if (lowerKey === 'status' || lowerKey === 'leadstatus') row.status = val;
          else row[key] = val;
        }

        const result = validateRow(row);
        if (result.isValid) {
          validRows.push(result.data);
        } else {
          invalidRows.push({
            ...rawRow,
            _failure_reason: result.reason,
          });
        }
      })
      .on('end', () => {
        resolve({ validRows, invalidRows, totalCount: rowCount });
      });
  });
}

(async () => {
  try {
    // 1. Strict Header Check before parsing or row validation
    const headerCheck = await validateCsvFileHeaders(workerData.filePath);
    if (!headerCheck.isValid) {
      parentPort.postMessage({ success: false, error: headerCheck.message });
      return;
    }

    // 2. Row data parsing & validation
    const result = await parseAndValidate(workerData.filePath);
    parentPort.postMessage({ success: true, ...result });
  } catch (err) {
    parentPort.postMessage({ success: false, error: err?.message || String(err) });
  }
})();
