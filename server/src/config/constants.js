// Single source of truth for the enumerations used by the DB schema, validators and the frontend.
const PROPERTY_TYPES = ['1 BHK', '2 BHK', '3 BHK', '4+ BHK', 'Villa', 'Plot', 'Commercial'];

const LEAD_SOURCES = ['Facebook', 'Google', 'Instagram', 'Referral', 'Website', 'Walk-in', 'Other'];

const LEAD_STATUSES = ['New', 'Contacted', 'Site Visit', 'Closed'];

const SORTABLE_FIELDS = {
  date: 'created_at',
  budget: 'budget',
  name: 'name',
};

module.exports = { PROPERTY_TYPES, LEAD_SOURCES, LEAD_STATUSES, SORTABLE_FIELDS };
