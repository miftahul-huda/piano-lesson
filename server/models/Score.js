const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Score = sequelize.define('Score', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalFile: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Parsed notes as JSON array'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

module.exports = Score;
