const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Lead = sequelize.define(
  'Lead',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    budget: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('budget');
        return val === null ? null : parseFloat(val);
      },
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    propertyType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'property_type',
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'New',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    tableName: 'leads',
    timestamps: true,
  }
);

module.exports = Lead;
