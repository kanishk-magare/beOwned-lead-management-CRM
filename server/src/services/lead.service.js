const { Op } = require('sequelize');
const { Lead, Note } = require('../models');
const AppError = require('../utils/AppError');

// Get all leads with optional search, filters, sorting, and pagination
async function listLeads({ search, source, status, sortBy = 'date', order = 'desc', page = 1, limit = 10 }) {
  const where = {};

  if (search) {
    const cleanSearch = search.trim();
    where[Op.or] = [
      { name: { [Op.iLike]: `%${cleanSearch}%` } },
      { phone: { [Op.iLike]: `%${cleanSearch.replace(/[\s-]/g, '')}%` } },
      { location: { [Op.iLike]: `%${cleanSearch}%` } },
    ];
  }

  if (source) {
    where.source = source;
  }

  if (status) {
    where.status = status;
  }

  // Determine sort column using Sequelize ordering
  let sortField = 'createdAt';
  if (sortBy === 'budget') sortField = 'budget';
  if (sortBy === 'name') sortField = 'name';

  const sortDirection = (order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const offset = (pageNum - 1) * limitNum;

  const result = await Lead.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [
      [sortField, sortDirection],
      ['id', sortDirection],
    ],
  });

  return {
    leads: result.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: result.count,
      totalPages: Math.max(1, Math.ceil(result.count / limitNum)),
    },
  };
}

// Get a single lead by ID with its associated notes
async function getLeadById(leadId) {
  const lead = await Lead.findByPk(leadId, {
    include: [
      {
        model: Note,
        as: 'notes',
      },
    ],
    order: [[{ model: Note, as: 'notes' }, 'createdAt', 'DESC']],
  });

  if (!lead) {
    throw AppError.notFound(`Lead #${leadId} not found`);
  }

  return lead;
}

// Create a new lead
async function createLead(data) {
  const lead = await Lead.create(data);
  return lead;
}

// Update an existing lead's details
async function updateLead(leadId, data) {
  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    throw AppError.notFound(`Lead #${leadId} not found`);
  }

  await lead.update(data);
  return lead;
}

// Delete a lead by ID
async function deleteLead(leadId) {
  const deletedCount = await Lead.destroy({
    where: {
      id: leadId,
    },
  });

  if (deletedCount === 0) {
    throw AppError.notFound(`Lead #${leadId} not found`);
  }
}

// List notes for a specific lead
async function listNotes(leadId) {
  await ensureLeadExists(leadId);
  const notes = await Note.findAll({
    where: { leadId },
    order: [['createdAt', 'DESC']],
  });
  return notes;
}

// Add a new note to a lead
async function addNote(leadId, content) {
  await ensureLeadExists(leadId);
  const note = await Note.create({
    leadId,
    content,
  });
  return note;
}

// Delete a note belonging to a lead
async function deleteNote(leadId, noteId) {
  const deletedCount = await Note.destroy({
    where: {
      id: noteId,
      leadId,
    },
  });

  if (deletedCount === 0) {
    throw AppError.notFound(`Note #${noteId} not found for lead #${leadId}`);
  }
}

// Helper to verify that a lead exists before operating on its notes
async function ensureLeadExists(leadId) {
  const lead = await Lead.findByPk(leadId, { attributes: ['id'] });
  if (!lead) {
    throw AppError.notFound(`Lead #${leadId} not found`);
  }
}

// Fetch all matching leads for CSV export (no pagination)
async function exportLeads({ search, source, status, sortBy = 'date', order = 'desc' } = {}) {
  const where = {};

  if (search) {
    const cleanSearch = search.trim();
    where[Op.or] = [
      { name: { [Op.iLike]: `%${cleanSearch}%` } },
      { phone: { [Op.iLike]: `%${cleanSearch.replace(/[\s-]/g, '')}%` } },
      { location: { [Op.iLike]: `%${cleanSearch}%` } },
    ];
  }

  if (source) {
    where.source = source;
  }

  if (status) {
    where.status = status;
  }

  let sortField = 'createdAt';
  if (sortBy === 'budget') sortField = 'budget';
  if (sortBy === 'name') sortField = 'name';

  const sortDirection = (order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const leads = await Lead.findAll({
    where,
    order: [
      [sortField, sortDirection],
      ['id', sortDirection],
    ],
  });

  return leads.map((l) => l.toJSON());
}

module.exports = {
  listLeads,
  exportLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  listNotes,
  addNote,
  deleteNote,
};
