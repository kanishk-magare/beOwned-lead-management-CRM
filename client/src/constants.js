// Mirrors server/src/config/constants.js (also available at GET /api/meta)
export const PROPERTY_TYPES = ['1 BHK', '2 BHK', '3 BHK', '4+ BHK', 'Villa', 'Plot', 'Commercial'];
export const LEAD_SOURCES = ['Facebook', 'Google', 'Instagram', 'Referral', 'Website', 'Walk-in', 'Other'];
export const LEAD_STATUSES = ['New', 'Contacted', 'Site Visit', 'Closed'];

export const SORT_OPTIONS = [
  { value: 'date:desc', label: 'Newest first' },
  { value: 'date:asc', label: 'Oldest first' },
  { value: 'budget:desc', label: 'Budget: high → low' },
  { value: 'budget:asc', label: 'Budget: low → high' },
];
