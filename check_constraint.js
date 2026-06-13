require('dotenv').config();
const { sequelize } = require('./src/models');

async function run() {
    try {
        const [results] = await sequelize.query(`
            SELECT pg_get_constraintdef(c.oid) AS constraint_def
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE c.conname = 'chk_users_premium_plan_code';
        `);
        console.log(results);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
run();
