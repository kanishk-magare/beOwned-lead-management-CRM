const { sequelize } = require('../config/db');
const Lead = require('./Lead');
const Note = require('./Note');

// Associations
Lead.hasMany(Note, { foreignKey: 'lead_id', as: 'notes', onDelete: 'CASCADE' });
Note.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

module.exports = {
  sequelize,
  Lead,
  Note,
};
