const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Note = sequelize.define(
  'Note',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'lead_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    tableName: 'lead_notes',
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = Note;
