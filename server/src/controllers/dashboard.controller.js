const dashboardService = require('../services/dashboard.service');

// Fetch dashboard summary statistics, metrics, and chart distributions
const stats = async (req, res, next) => {
  try {
    console.log('Fetching dashboard stats');
    const data = await dashboardService.getStats();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error while fetching dashboard stats:', error);
    next(error);
  }
};

module.exports = { stats };
