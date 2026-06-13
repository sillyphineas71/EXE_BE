require('dotenv').config();
const { sequelize } = require('./src/models');

async function checkSchema() {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log("Columns in 'users' table:", results);
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}
checkSchema();
