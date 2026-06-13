require('dotenv').config();
const { User, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');

const role_id = "00000000-0000-0000-0000-000000000002";

const premiums = [
    { name: 'Nguyễn Đức Bình', amount: 120000, phone: '0971753678' },
    { name: 'Trần Đán', amount: 120000, phone: '0359032005' },
    { name: 'Nguyễn Thị Ánh Dương', amount: 550000, phone: '0345978501' },
    { name: 'Trần Chu An', amount: 1000000, phone: '0362122056' },
    { name: 'Phạm Gia Bảo', amount: 1000000, phone: '0357062268' },
    { name: 'Đỗ Minh Hiếu', amount: 120000, phone: '0395022632' },
    { name: 'Nguyễn Minh Quân', amount: 550000, phone: '0345670907' },
    { name: 'Kiều Quang Việt', amount: 550000, phone: '' },
    { name: 'Nguyễn Tiến Dũng', amount: 120000, phone: '0352033029' },
    { name: 'Giang Trung Hiếu', amount: 120000, phone: '0966875204' },
    { name: 'Bùi An Thanh Thảo', amount: 120000, phone: '' },
    { name: 'Nguyễn Thị Jana', amount: 120000, phone: '0855118858' },
    { name: 'Hoàng Thị Khánh Linh', amount: 120000, phone: '' },
    { name: 'Trần Thị Ngọc Trâm', amount: 550000, phone: '0338750386' },
    { name: 'Trương Công Minh', amount: 1000000, phone: '0973863564' },
    { name: 'Nguyễn Thành Thường', amount: 120000, phone: '0967115532' },
    { name: 'Phan Phương Ánh', amount: 120000, phone: '0936658635' },
    { name: 'Lương Kiều Anh', amount: 550000, phone: '0965218063' },
    { name: 'Đỗ Thị Ngọc Linh', amount: 120000, phone: '0337926980' },
    { name: 'Vũ Đỗ Quyên', amount: 120000, phone: '0373687514' },
    { name: 'Nguyễn Trà Giang', amount: 550000, phone: '0373311334' },
    { name: 'Lê Phú Khang', amount: 120000, phone: '0866582889' },
    { name: 'Vũ Minh Phúc', amount: 120000, phone: '' },
    { name: 'Nguyễn Thị Phương Anh', amount: 550000, phone: '0964555258' },
    { name: 'Lê Sỹ Hiệp', amount: 120000, phone: '0368979314' },
    { name: 'Đỗ Xuân Toàn', amount: 120000, phone: '0823659996' },
    { name: 'Giang Ngọc Sơn', amount: 120000, phone: '0816153336' },
    { name: 'Nguyễn Trà My', amount: 550000, phone: '0911920216' },
    { name: 'Hoàng Minh Đại', amount: 120000, phone: '0336551298' },
    { name: 'Nguyễn Công Thành', amount: 120000, phone: '' },
    { name: 'Nguyễn Xuân Đức', amount: 550000, phone: '' },
    { name: 'Nguyễn Bá Hiển', amount: 550000, phone: '' },
    { name: 'Lương Thu Hằng', amount: 120000, phone: '0904876723' },
    { name: 'Đỗ Nhật Long', amount: 550000, phone: '' },
    { name: 'Trương Đức Mạnh', amount: 550000, phone: '' },
    { name: 'Nguyễn Việt Hoàng', amount: 550000, phone: '' },
    { name: 'Nguyễn Đức Hiếu', amount: 550000, phone: '' },
    { name: 'Đinh Trường Giang', amount: 120000, phone: '' },
    { name: 'Tống Khánh Ly', amount: 120000, phone: '' },
    { name: 'Huy', amount: 550000, phone: '' },
    { name: 'Ngô Thu Hường', amount: 120000, phone: '' },
    { name: 'Nguyễn Thu Thảo', amount: 120000, phone: '' },
    { name: 'Vũ Thu Hiền', amount: 120000, phone: '' },
    { name: 'Phan Thanh Hà', amount: 120000, phone: '0335101909' },
    { name: 'Phạm Tuấn Anh', amount: 120000, phone: '' },
    { name: 'Chu Ngọc Dũng', amount: 120000, phone: '' },
    { name: 'Phạm Lan Phương', amount: 120000, phone: '' },
    { name: 'Nguyễn Công Tuấn Anh', amount: 120000, phone: '' },
    { name: 'Nguyễn Minh Quân', amount: 550000, phone: '' },
    { name: 'Chu Việt Hải', amount: 120000, phone: '' },
    { name: 'Nguyễn Tố Nga', amount: 120000, phone: '' },
    { name: 'Nguyễn Anh Quân', amount: 550000, phone: '' },
    { name: 'Nguyễn Bá Quảng', amount: 1000000, phone: '' },
    { name: 'Trần Thị Ánh Dương', amount: 120000, phone: '0961784648' },
    { name: 'Vũ Đức Anh', amount: 120000, phone: '0395458686' },
    { name: 'Nguyễn Tùng Dương', amount: 550000, phone: '' },
    { name: 'Phạm Văn Nam', amount: 1000000, phone: '' }
];

const removeAccents = (str) => {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const domains = ['gmail.com', 'fpt.edu.vn', 'outlook.com', 'yahoo.com', 'hotmail.com'];

const generateEmail = (fullName) => {
    const parts = removeAccents(fullName).toLowerCase().split(/\s+/);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const randomChoice = Math.floor(Math.random() * 3);
    
    let base = '';
    if (parts.length > 1) {
        if (randomChoice === 0) {
            // first letter of each part + last part -> e.g., ntdung
            base = parts.slice(0, parts.length - 1).map(p => p[0]).join('') + parts[parts.length - 1];
        } else if (randomChoice === 1) {
            // last part + first chars -> dungnt
            base = parts[parts.length - 1] + parts.slice(0, parts.length - 1).map(p => p[0]).join('');
        } else {
            // full name together -> nguyentiendung
            base = parts.join('');
        }
    } else {
        base = parts[0];
    }
    
    const randomExtension = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${base}${randomExtension}@${domain}`;
};

const generateRandomPhone = () => {
    const prefixes = ['09', '03', '08', '07', '05'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const digits = Math.floor(10000000 + Math.random() * 90000000);
    return prefix + digits.toString();
};

const getPremiumDetails = (amount) => {
    const createdAt = new Date();
    // randomize created at past month a bit
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 10));
    const expiresAt = new Date(createdAt);

    if (amount === 120000) {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        return { plan: 'monthly', expiresAt, createdAt };
    } else if (amount === 550000) {
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        return { plan: '6_months', expiresAt, createdAt };
    } else if (amount === 1000000) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        return { plan: 'yearly', expiresAt, createdAt };
    }
    return { plan: 'monthly', expiresAt, createdAt }; // Fallback
};

async function run() {
    try {
        const hash = await bcrypt.hash('123456', 10);
        
        const existingUsers = await User.findAll({ attributes: ['email'] });
        const existingEmails = new Set(existingUsers.map(u => u.email));

        const records = premiums.map(customer => {
            const details = getPremiumDetails(customer.amount);
            
            let email = generateEmail(customer.name);
            while(existingEmails.has(email)) {
                email = generateEmail(customer.name);
            }
            existingEmails.add(email); // prevent duplicates within batch

            return {
                email: email,
                full_name: customer.name,
                phone_number: customer.phone || generateRandomPhone(),
                role_id: role_id, // assuming premium is still this role or we just track by account_tier
                password_hash: hash,
                status: 'active',
                account_tier: 'premium',
                premium_plan_code: details.plan,
                premium_expires_at: details.expiresAt,
                created_at: details.createdAt,
                updated_at: details.createdAt,
            };
        });
        
        console.log(`Inserting ${records.length} premium users...`);
        await User.bulkCreate(records);
        console.log('Successfully inserted premium users!');
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            console.error('Unique Constraint Error!');
            err.errors.forEach(e => console.error(`- ${e.message} (value: ${e.value})`));
        } else if (err.name === 'SequelizeValidationError') {
            console.error('Validation Error!');
            err.errors.forEach(e => console.error(`- ${e.message}`));
        } else {
            console.error('Insertion failed:', err.message || err);
        }
    } finally {
        await sequelize.close();
    }
}
run();
