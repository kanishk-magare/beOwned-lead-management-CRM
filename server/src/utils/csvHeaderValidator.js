const fs = require('fs');

// Expected columns and their acceptable variations
const EXPECTED_HEADERS = [
  { key: 'name', expectedLabel: 'Name', validMatches: ['name', 'fullname', 'full name', 'client name'] },
  { key: 'phone', expectedLabel: 'Phone', validMatches: ['phone', 'phonenumber', 'phone number', 'mobile', 'contact', 'contact number'] },
  { key: 'email', expectedLabel: 'Email', validMatches: ['email', 'emailaddress', 'email address'] },
  { key: 'budget', expectedLabel: 'Budget', validMatches: ['budget', 'price'] },
  { key: 'location', expectedLabel: 'Location', validMatches: ['location', 'address', 'city'] },
  { key: 'propertyType', expectedLabel: 'Property Type', validMatches: ['propertytype', 'property type', 'property_type'] },
  { key: 'source', expectedLabel: 'Source', validMatches: ['source', 'leadsource', 'lead source', 'lead_source'] },
  { key: 'status', expectedLabel: 'Status', validMatches: ['status', 'leadstatus', 'lead status', 'lead_status'] },
];

// Helper to remove spaces, underscores, dashes, and lowercase for easy comparison
function normalize(str) {
  return (str || '').toLowerCase().replace(/[\s_-]/g, '');
}

// Splits the first line into column names, trimming quotes and whitespace
function parseHeaderLine(line) {
  const clean = line.replace(/^\uFEFF/, '').trim();
  return clean
    .split(',')
    .map((h) => h.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

// Validates that all required headers are present, unique, and valid
function validateHeaders(headers) {
  if (!headers || headers.length === 0) {
    return {
      isValid: false,
      message: 'CSV file is empty or missing column headers.',
    };
  }

  // 1. Check for duplicate columns
  const seen = new Set();
  for (const header of headers) {
    const norm = normalize(header);
    if (seen.has(norm)) {
      return {
        isValid: false,
        message: `Duplicate column header found: "${header}". Each column must be unique.`,
      };
    }
    seen.add(norm);
  }

  // 2. Check for unknown/extra columns
  const unknown = [];
  for (const header of headers) {
    const norm = normalize(header);
    const isMatch = EXPECTED_HEADERS.some((col) =>
      col.validMatches.some((m) => normalize(m) === norm)
    );
    if (!isMatch) {
      unknown.push(header);
    }
  }

  if (unknown.length > 0) {
    const validList = EXPECTED_HEADERS.map((h) => h.expectedLabel).join(', ');
    return {
      isValid: false,
      message: `Invalid column header(s): "${unknown.join('", "')}". Allowed headers are: ${validList}`,
    };
  }

  // 3. Check for missing required columns
  const missing = [];
  for (const col of EXPECTED_HEADERS) {
    const found = headers.some((header) => {
      const norm = normalize(header);
      return col.validMatches.some((m) => normalize(m) === norm);
    });
    if (!found) {
      missing.push(col.expectedLabel);
    }
  }

  if (missing.length > 0) {
    return {
      isValid: false,
      message: `Missing required column(s): ${missing.join(', ')}`,
    };
  }

  return { isValid: true };
}

const readline = require('readline');

// Asynchronously reads ONLY the first non-empty line via stream and validates headers
async function validateCsvFileHeaders(filePath) {
  let fileStream = null;
  let rl = null;
  try {
    fileStream = fs.createReadStream(filePath);
    rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let firstLine = null;
    for await (const line of rl) {
      if (line.trim().length > 0) {
        firstLine = line;
        break;
      }
    }

    if (!firstLine) {
      return {
        isValid: false,
        message: 'CSV file is empty or missing headers.',
      };
    }

    const headers = parseHeaderLine(firstLine);
    return validateHeaders(headers);
  } catch (err) {
    return {
      isValid: false,
      message: `Could not read CSV file headers: ${err.message}`,
    };
  } finally {
    if (rl) rl.close();
    if (fileStream) fileStream.destroy();
  }
}

module.exports = {
  EXPECTED_HEADERS,
  parseHeaderLine,
  validateHeaders,
  validateCsvFileHeaders,
};
