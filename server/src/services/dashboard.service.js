const moment = require('moment');
const { Op } = require('sequelize');
const { sequelize, Lead } = require('../models');
const { LEAD_SOURCES, LEAD_STATUSES } = require('../config/constants');

// Turns [{key, count}] rows into a complete list including zero-count categories
const fillCategories = (categories, rows, key) => {
  const counts = Object.fromEntries(rows.map((r) => [r[key], Number(r.count)]));
  return categories.map((c) => ({ [key]: c, count: counts[c] || 0 }));
};

// Aggregate pipeline metrics, conversion rates, and lead distribution stats using Sequelize
async function getStats() {
  const oneWeekAgo = moment().subtract(7, 'days').toDate();

  const [totalLeads, closedLeads, newThisWeek, budgetStats, closedBudget, bySource, byStatus, recentLeads] =
    await Promise.all([
      Lead.count(),
      Lead.count({ where: { status: 'Closed' } }),
      Lead.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } }),
      Lead.findAll({
        attributes: [[sequelize.fn('AVG', sequelize.col('budget')), 'averageBudget']],
        raw: true,
      }),
      Lead.sum('budget', { where: { status: 'Closed' } }),
      Lead.findAll({
        attributes: ['source', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['source'],
        raw: true,
      }),
      Lead.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Lead.findAll({
        attributes: ['id', 'name', 'source', 'status', 'budget', 'createdAt'],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: 5,
      }),
    ]);

  const rawAvg = budgetStats[0]?.averageBudget;
  const averageBudget = rawAvg ? Math.round(Number(rawAvg)) : 0;
  const closedValue = closedBudget ? Number(closedBudget) : 0;
  const conversionRate = totalLeads === 0 ? 0 : Number(((closedLeads / totalLeads) * 100).toFixed(1));

  return {
    totalLeads,
    closedLeads,
    newThisWeek,
    conversionRate,
    averageBudget,
    closedValue,
    leadsBySource: fillCategories(LEAD_SOURCES, bySource, 'source').sort((a, b) => b.count - a.count),
    statusDistribution: fillCategories(LEAD_STATUSES, byStatus, 'status'),
    recentLeads,
  };
}

module.exports = { getStats };
