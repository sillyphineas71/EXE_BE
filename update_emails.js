require('dotenv').config();
const { User, sequelize } = require('./src/models');
const { Op } = require('sequelize');

const removeAccents = (str) => {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

const generateEmail = (fullName) => {
    const cleanName = removeAccents(fullName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `${cleanName}${randomNum}@gmail.com`;
}

async function run() {
    try {
        const users = await User.findAll({
            where: {
                role_id: '00000000-0000-0000-0000-000000000002',
                email: {
                    [Op.like]: '%@fpt.edu.vn'
                }
            }
        });

        console.log(`Found ${users.length} users with @fpt.edu.vn email.`);

        if (users.length === 0) {
            console.log('No users found.');
            return;
        }

        // Shuffle the array to pick random half
        for (let i = users.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [users[i], users[j]] = [users[j], users[i]];
        }

        const halfCount = Math.floor(users.length / 2);
        const selectedUsers = users.slice(0, halfCount);
        console.log(`Selected ${selectedUsers.length} users to update to @gmail.com`);

        for (const user of selectedUsers) {
            let newEmail = generateEmail(user.full_name);
            
            // basic check to ensure uniqueness or retry a bit
            let isUnique = false;
            let retries = 0;
            while (!isUnique && retries < 5) {
                const existing = await User.findOne({ where: { email: newEmail } });
                if (!existing) {
                    isUnique = true;
                } else {
                    newEmail = generateEmail(user.full_name);
                    retries++;
                }
            }

            if (isUnique) {
                console.log(`Updating ${user.email} -> ${newEmail}`);
                await user.update({ email: newEmail });
            } else {
                console.log(`Could not generate a unique email for ${user.full_name}`);
            }
        }
        console.log('Finished updating emails.');

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}
run();
