const moment = require('moment');
const leadService = require('../services/lead.service');

// Get all leads with optional search, filters, and pagination
const list = async (req, res, next) => {
  try {
    console.log('Fetching leads');
    const result = await leadService.listLeads(req.validatedQuery);
    console.log(`Fetched ${result.leads.length} leads`);
    return res.status(200).json({ success: true, data: result.leads, pagination: result.pagination });
  } catch (error) {
    console.error('Error while fetching leads:', error);
    next(error);
  }
};

// Get a single lead by ID with its notes
const getOne = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    console.log(`Fetching lead: ${leadId}`);
    const lead = await leadService.getLeadById(leadId);
    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error(`Error while fetching lead ${req.params.id}:`, error);
    next(error);
  }
};

// Create a new lead
const create = async (req, res, next) => {
  try {
    console.log('Creating new lead');
    const lead = await leadService.createLead(req.body);
    console.log(`Lead created successfully with ID: ${lead.id}`);
    return res.status(201).location(`/api/leads/${lead.id}`).json({ success: true, data: lead });
  } catch (error) {
    console.error('Error while creating lead:', error);
    next(error);
  }
};

// Update an existing lead's details
const update = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    console.log(`Updating lead: ${leadId}`);
    const lead = await leadService.updateLead(leadId, req.body);
    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error(`Error while updating lead ${req.params.id}:`, error);
    next(error);
  }
};

// Quick update for lead pipeline status
const updateStatus = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    const { status } = req.body;
    console.log(`Updating lead status: ${leadId} -> ${status}`);
    const lead = await leadService.updateLead(leadId, { status });
    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error(`Error while updating lead status ${req.params.id}:`, error);
    next(error);
  }
};

// Delete a lead and its associated notes
const remove = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    console.log(`Deleting lead: ${leadId}`);
    await leadService.deleteLead(leadId);
    return res.status(204).end();
  } catch (error) {
    console.error(`Error while deleting lead ${req.params.id}:`, error);
    next(error);
  }
};

// Get all notes for a specific lead
const listNotes = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    const notes = await leadService.listNotes(leadId);
    return res.status(200).json({ success: true, data: notes });
  } catch (error) {
    console.error(`Error while fetching notes for lead ${req.params.id}:`, error);
    next(error);
  }
};

// Add a new note to a lead's timeline
const addNote = async (req, res, next) => {
  try {
    const leadId = req.params.id;
    console.log(`Adding note to lead: ${leadId}`);
    const note = await leadService.addNote(leadId, req.body.content);
    return res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error(`Error while adding note to lead ${req.params.id}:`, error);
    next(error);
  }
};

// Delete a specific note from a lead
const removeNote = async (req, res, next) => {
  try {
    const { id: leadId, noteId } = req.params;
    await leadService.deleteNote(leadId, noteId);
    return res.status(204).end();
  } catch (error) {
    console.error(`Error while deleting note ${req.params.noteId}:`, error);
    next(error);
  }
};

const { Worker } = require('worker_threads');
const path = require('path');

function generateCsvWithWorker(leads) {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve(__dirname, '../workers/csvExportWorkerThread.js');
    const worker = new Worker(workerPath, {
      workerData: { leads },
    });

    worker.on('message', (msg) => {
      if (msg && msg['watch:require']) return;
      if (msg && msg.success) {
        resolve(msg.csvContent);
      } else {
        reject(new Error(msg?.error || 'Failed to generate CSV in worker thread'));
      }
    });

    worker.on('error', (err) => {
      reject(err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`CSV export worker stopped with exit code ${code}`));
      }
    });
  });
}

// Export leads to CSV matching the active search/filter criteria
const exportCsv = async (req, res, next) => {
  try {
    console.log('Exporting leads to CSV');
    const { search, source, status, sortBy = 'date', order = 'desc' } = req.query;
    const leads = await leadService.exportLeads({ search, source, status, sortBy, order });
    console.log(`Exporting ${leads.length} leads to CSV`);

    // Use worker thread to serialize and format CSV off the main Node.js thread
    const csvContent = await generateCsvWithWorker(leads);
    const timestamp = moment().format('YYYY-MM-DD');
    const filename = `leads_export_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error while exporting leads to CSV:', error);
    next(error);
  }
};

module.exports = {
  list,
  exportCsv,
  getOne,
  create,
  update,
  updateStatus,
  remove,
  listNotes,
  addNote,
  removeNote,
};
