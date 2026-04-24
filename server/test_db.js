const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost:5432/piano_lesson', {
  logging: false
});

async function run() {
  try {
    const [results] = await sequelize.query('SELECT * FROM "Users"');
    console.log(results);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
run();
