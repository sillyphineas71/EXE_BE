require('dotenv').config();
const { sequelize } = require('./src/models');

async function run() {
    try {
        await sequelize.query('ALTER TABLE users DROP CONSTRAINT chk_users_premium_plan_code;');
        await sequelize.query("ALTER TABLE users ADD CONSTRAINT chk_users_premium_plan_code CHECK (premium_plan_code IS NULL OR premium_plan_code IN ('monthly', '6_months', 'yearly'));");
        console.log('Successfully updated constraint.');
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
run();
