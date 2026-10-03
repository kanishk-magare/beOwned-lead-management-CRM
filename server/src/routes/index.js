const router = require('express').Router();
const db = require('../config/db');
const leadRoutes = require('./lead.routes');
const dashboardController = require('../controllers/dashboard.controller');
const asyncHandler = require('../utils/asyncHandler');
const { PROPERTY_TYPES, LEAD_SOURCES, LEAD_STATUSES } = require('../config/constants');

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    await db.query('SELECT 1');
    res.json({ success: true, data: { status: 'ok', database: 'connected' } });
  })
);

// Dropdown options for the frontend, so enums live in one place
router.get('/meta', (req, res) => {
  res.json({
    success: true,
    data: { propertyTypes: PROPERTY_TYPES, sources: LEAD_SOURCES, statuses: LEAD_STATUSES },
  });
});

router.get('/dashboard/stats', dashboardController.stats);
router.use('/leads', leadRoutes);
router.use('/locations', require('./location.routes'));

module.exports = router;
