const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: false // usually high priority for cloud DBs but user didn't specify, standard node-postgres might need it if the server enforces it
  }
});

module.exports = sequelize;
