import { LEAD_SOURCES, PROPERTY_TYPES, LEAD_STATUSES } from '../constants.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(\+91)?[6-9]\d{9}$/;
const NAME_RE = /^[\p{L}\s.'-]+$/u;

/**
 * Client-side validation mirroring the server's zod schema, for instant feedback.
 * The server remains the source of truth and its errors are shown too.
 */
export function validateLead(values) {
  const errors = {};
  const name = values.name.trim();
  const phone = values.phone.replace(/[\s-]/g, '');
  const budget = Number(values.budget);

  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  else if (!NAME_RE.test(name)) errors.name = "Name can only contain letters, spaces, . ' -";

  if (!phone) errors.phone = 'Phone number is required';
  else if (!PHONE_RE.test(phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number';

  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address';

  if (values.budget === '' || values.budget === null) errors.budget = 'Budget is required';
  else if (!Number.isFinite(budget) || budget <= 0) errors.budget = 'Budget must be greater than 0';

  if (!values.location.trim()) errors.location = 'Location is required';
  else if (values.location.trim().length < 2) errors.location = 'Location must be at least 2 characters';

  if (!PROPERTY_TYPES.includes(values.propertyType)) errors.propertyType = 'Select a property type';
  if (!LEAD_SOURCES.includes(values.source)) errors.source = 'Select a lead source';
  if (values.status && !LEAD_STATUSES.includes(values.status)) errors.status = 'Select a valid status';

  return errors;
}

export function toPayload(values) {
  return {
    name: values.name.trim(),
    phone: values.phone.replace(/[\s-]/g, ''),
    email: values.email.trim().toLowerCase(),
    budget: Number(values.budget),
    location: values.location.trim(),
    propertyType: values.propertyType,
    source: values.source,
    status: values.status || 'New',
  };
}
