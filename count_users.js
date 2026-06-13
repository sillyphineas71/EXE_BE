require('dotenv').config();
const { User, sequelize } = require('./src/models');

async function run() {
    try {
        const count = await User.count();
        console.log(`Total users in database: ${count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
run();
