const { z } = require('zod');
const { PROPERTY_TYPES, LEAD_SOURCES, LEAD_STATUSES, SORTABLE_FIELDS } = require('../config/constants');

const trimmed = (field, min, max) =>
  z
    .string({ required_error: `${field} is required`, invalid_type_error: `${field} must be text` })
    .trim()
    .min(min, min === 1 ? `${field} is required` : `${field} must be at least ${min} characters`)
    .max(max, `${field} must be at most ${max} characters`);

const leadBody = z.object({
  name: trimmed('Name', 2, 100).regex(/^[\p{L}\s.'-]+$/u, 'Name can only contain letters, spaces, . \' -'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'))
    // Store the bare 10-digit number so "+91 98765 43210" and "9876543210" are the same lead
    .transform((v) => v.slice(-10)),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(255),
  budget: z.coerce
    .number({ invalid_type_error: 'Budget must be a number', required_error: 'Budget is required' })
    .positive('Budget must be greater than 0')
    .max(1e12, 'Budget is unrealistically large'),
  location: trimmed('Location', 2, 500),
  propertyType: z.enum(PROPERTY_TYPES, {
    errorMap: () => ({ message: `Property type must be one of: ${PROPERTY_TYPES.join(', ')}` }),
  }),
  source: z.enum(LEAD_SOURCES, {
    errorMap: () => ({ message: `Source must be one of: ${LEAD_SOURCES.join(', ')}` }),
  }),
  status: z
    .enum(LEAD_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${LEAD_STATUSES.join(', ')}` }),
    })
    .optional(),
});

const createLeadSchema = leadBody;
const updateLeadSchema = leadBody.partial().refine((obj) => Object.keys(obj).length > 0, {
  message: 'Provide at least one field to update',
});

const updateStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${LEAD_STATUSES.join(', ')}` }),
  }),
});

const createNoteSchema = z.object({
  content: trimmed('Note', 1, 2000),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid lead id'),
});

const noteParamSchema = idParamSchema.extend({
  noteId: z.coerce.number().int().positive('Invalid note id'),
});

const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);

const listLeadsQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  source: z.preprocess(emptyToUndefined, z.enum(LEAD_SOURCES).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(LEAD_STATUSES).optional()),
  sortBy: z.preprocess(emptyToUndefined, z.enum(Object.keys(SORTABLE_FIELDS)).default('date')),
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(10)),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  updateStatusSchema,
  createNoteSchema,
  idParamSchema,
  noteParamSchema,
  listLeadsQuerySchema,
};
