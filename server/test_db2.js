const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function run() {
  try {
    const [results] = await sequelize.query('SELECT id, email, name, picture FROM "Users"');
    console.log("Users in DB:", results);
  } catch (e) {
    console.error("DB error:", e.message);
  } finally {
    await sequelize.close();
  }
}
run();
