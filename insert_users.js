require('dotenv').config();
const { User, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');

const role_id = "00000000-0000-0000-0000-000000000002";
const emails_names = `
vanntha180069@fpt.edu.vn( Nguyễn Thị Vân)
caupvhe160302@fpt.edu.vn( Phạm Văn Cầu)
hieubmhe160402@fpt.edu.vn( Bùi Minh Hiếu)
anhlthe161139@fpt.edu.vn( Lê Tuấn Anh)
hiendvhe163113@fpt.edu.vn( Đỗ Văn Hiến)
hungbvhe163146@fpt.edu.vn( Bùi Việt Hùng)
minhndhe170279@fpt.edu.vn( Nguyễn Đức Minh)
longvhhe170911@fpt.edu.vn( Vũ Hoàng Long)
manhnhhe171461@fpt.edu.vn( Nguyễn Hùng Mạnh)
trunghnhe172033@fpt.edu.vn( Hồ Ngọc Trung)
anhvhhe172381@fpt.edu.vn( Vũ Hoàng Anh)
anhnthe172847@fpt.edu.vn( Nguyễn Tuấn Anh)
trinhltlhe173237@fpt.edu.vn( Lê Thị Lâm Trinh)
haitthe176582@fpt.edu.vn( Trần Thanh Hải)
anhdnhhe176689@fpt.edu.vn( Đỗ Ngọc Hoàng Anh)
binhvahe180123@fpt.edu.vn( Vương Anh Bình)
hieutmhe180168@fpt.edu.vn( Trần Minh Hiếu)
nhituhe180254@fpt.edu.vn( Tạ Uyển Nhi)
giapnxnhe180600@fpt.edu.vn( Nguyễn Xuân Nguyên Giáp)
haitdhe180965@fpt.edu.vn( Trần Đức Hải)
phucdhhe181106@fpt.edu.vn( Đàm Hồng Phúc)
taindhe181162@fpt.edu.vn( Nguyễn Đức Tài)
sonnhhe181289@fpt.edu.vn( Nguyễn Hoàng Sơn)
tainhhe181471@fpt.edu.vn( Nguyễn Hữu Tài)
minhndhe181739@fpt.edu.vn( Nguyễn Đức Minh)
vietnhhe181929@fpt.edu.vn( Nguyễn Hoàng Việt)
mungnthe181949@fpt.edu.vn( Nguyễn Thị Mừng)
cuongnthe182043@fpt.edu.vn( Nguyễn Thế Cương)
minhnhthe182044@fpt.edu.vn( Nguyễn Hữu Thái Minh)
phatpthe186162@fpt.edu.vn( Phạm Tiến Phát)
trinhvthe186282@fpt.edu.vn( Vũ Tuyết Trinh)
tiepnnkhe186589@fpt.edu.vn( Nguyễn Nghiêm Khánh Tiệp)
haindhe186607@fpt.edu.vn( Nguyễn Đức Hải)
tuantvhe186778@fpt.edu.vn( Trần Văn Tuấn)
haonthe186889@fpt.edu.vn( Nguyễn Tuấn Hào)
nhaipthe186985@fpt.edu.vn( Phùng Thị Nhài)
cuongddhe187090@fpt.edu.vn( Đặng Đức Cương)
lochhs171323@fpt.edu.vn( Hoàng Lộc)
thuongdths171447@fpt.edu.vn( Đặng Thị Thương)
namnths176002@fpt.edu.vn( Nguyễn Trung Nam)
nhittyhs180149@fpt.edu.vn( Tạ Thị Yến Nhi)
linhdnkhs180387@fpt.edu.vn( Đỗ Ngọc Khánh Linh)
tuandtmhs180541@fpt.edu.vn( Đoàn Trần Minh Tuấn)
nhipmyhs180598@fpt.edu.vn( Phạm Mai Yến Nhi)
trangnths180631@fpt.edu.vn( Ngô Thị Trang)
thuydnths180850@fpt.edu.vn( Đỗ Ngọc Thanh Thuỷ)
huyennths181069@fpt.edu.vn( Nguyễn Thanh Huyền)
anhntvhs181172@fpt.edu.vn( Nguyễn Thị Vân Anh)
hangdmhs186469@fpt.edu.vn( Đặng Minh Hằng)
quytdds170042@fpt.edu.vn( Trịnh Duy Quý)
duyenntmha186009@fpt.edu.vn( Nguyễn Thị Mỹ Duyên)
anhntlha186038@fpt.edu.vn( Nguyễn Thị Lan Anh)
chinhdnha186041@fpt.edu.vn( Đoàn Ngọc Chính)
longdbhe140948@fpt.edu.vn( Dương Bảo Long)
nhatcqhe141511@fpt.edu.vn( Chu Quang Nhật)
quanghmhe160861@fpt.edu.vn( Hoàng Minh Quang)
namnhhe161223@fpt.edu.vn( Ngô Hải Nam)
anhhdhe163200@fpt.edu.vn( Hoàng Đức Anh)
sonmthe163328@fpt.edu.vn( Mai Thế Sơn)
nhatdhhe163424@fpt.edu.vn( Dương Hải Nhật)
thanhtvhe163915@fpt.edu.vn( Trần Văn Thành)
hauhdhe170303@fpt.edu.vn( Hà Đức Hậu)
hungkthe170514@fpt.edu.vn( Kiều Tuấn Hưng)
phonghthe170574@fpt.edu.vn( Hồ Thế Phong)
vinhbhqhe170716@fpt.edu.vn( Bùi Hữu Quang Vinh)
linhdmhe170726@fpt.edu.vn( Dương Mai Linh)
nguyenlpthe171408@fpt.edu.vn( Lê Phan Thảo Nguyên)
toandkhe171709@fpt.edu.vn( Đỗ Khánh Toàn)
phongpthe172236@fpt.edu.vn( Phạm Tuấn Phong)
vietltqhe173238@fpt.edu.vn( Lành Triệu Quốc Việt)
datnmhe176051@fpt.edu.vn( Nguyễn Minh Đạt)
vinhlnhe176061@fpt.edu.vn( Lê Ngọc Vinh)
kienvthe176238@fpt.edu.vn( Vũ Trung Kiên)
binhndhe176470@fpt.edu.vn( Nguyễn Đức Bình)
nhivlhe176587@fpt.edu.vn( Vũ Linh Nhi)
anhnphe180146@fpt.edu.vn( Nguyễn Phương Anh)
binhvdhe180705@fpt.edu.vn( Vũ Đức Bình)
hieuvmhe180872@fpt.edu.vn( Vũ Mạnh Hiếu)
anhnthhe181824@fpt.edu.vn( Nguyễn Thanh Hoàng Anh)
minhnxhe182196@fpt.edu.vn( Nguyễn Xuân Minh)
hieudmhe182391@fpt.edu.vn( Đỗ Minh Hiểu)
hocndhs160619@fpt.edu.vn( Ngô Đức Học)
namdhhs163307@fpt.edu.vn( Đặng Hoài Nam)
thuydths170242@fpt.edu.vn( Đỗ Thanh Thuỷ)
tungpths170585@fpt.edu.vn( Phạm Thanh Tùng)
trangntths170640@fpt.edu.vn( Nguyễn Thị Thu Trang)
dungllths173031@fpt.edu.vn( Lê Lưu Thuỳ Dung)
sondhhs176085@fpt.edu.vn( Đinh Hồng Sơn)
vyhtyhs176098@fpt.edu.vn( Hoàng Thảo Yến Vy)
datbchs176136@fpt.edu.vn( Bùi Chí Đạt)
hungnths176263@fpt.edu.vn( Nguyễn Tiến Hùng)
anhpnhs186083@fpt.edu.vn( Phùng Ngọc Ánh)
hanntqha173038@fpt.edu.vn( Nguyễn Thị Quỳnh Hân)
nguyenpahe150906@fpt.edu.vn( Phạm Anh Nguyên)
minhvdnhe170210@fpt.edu.vn( Vũ Đỗ Nhật Minh)
phongpmhe170289@fpt.edu.vn( Phùng Mạnh Phong)
hungddhe170398@fpt.edu.vn( Doãn Đình Hưng)
phuclhhe170702@fpt.edu.vn( Lại Hoàng Phúc)
haonvhe170810@fpt.edu.vn( Nguyễn Văn Hảo)
sonnthe170825@fpt.edu.vn( Nguyễn Trường Sơn)
hoanxhe170914@fpt.edu.vn( Nguyễn Xuân Hoà)
thanhkhhe171010@fpt.edu.vn( Khương Hồng Thanh)
nhatnlhe171011@fpt.edu.vn( Nguyễn Long Nhật)
locphe171118@fpt.edu.vn( Phạm Lộc)
minhthhe171134@fpt.edu.vn( Trần Huy Minh)
hiephhhe171199@fpt.edu.vn( Hà Hoàng Hiệp)
hieunqhe171297@fpt.edu.vn( Nguyễn Quý Hiếu)
hieppdhe171309@fpt.edu.vn( Phạm Duy Hiệp)
anhtqnhe171313@fpt.edu.vn( Trần Quang Nam Anh)
anhnthe171626@fpt.edu.vn( Nguyễn Trung Anh)
annqhe171660@fpt.edu.vn( Ngô Quốc Ân)
dongtdhe171684@fpt.edu.vn( Trương Duy Đông)
dungndhe171812@fpt.edu.vn( Nguyễn Duy Dũng)
tiennthe171977@fpt.edu.vn( Nguyễn Trung Tiến)
quyentche171987@fpt.edu.vn( Trần Công Quyền)
ducdmhe172047@fpt.edu.vn( Đỗ Minh Đức)
ducnmhe172104@fpt.edu.vn( Nguyễn Minh Đức)
thanhhche172214@fpt.edu.vn( Hoàng Công Thành)
hungdche172264@fpt.edu.vn( Đặng Công Hùng)
minhpche172291@fpt.edu.vn( Phạm Công Minh)
datnvhe172295@fpt.edu.vn( Nguyễn Văn Đạt)
quyldhe173432@fpt.edu.vn( Lê Duy Quý)
hieupdhe176112@fpt.edu.vn( Phạm Đăng Hiếu)
binthhe176592@fpt.edu.vn( Trần Hồng Bin)
lamnhhe180768@fpt.edu.vn( Nguyễn Huy Lâm)
huyenltthe181265@fpt.edu.vn( Lê Thị Thanh Huyền)
dungvthe181581@fpt.edu.vn( Vũ Tuấn Dũng)
nguyentkhe182277@fpt.edu.vn( Trương Khoa Nguyên)
anhldhe190086@fpt.edu.vn( Lê Đức Anh)
yennhhs170417@fpt.edu.vn( Nguyễn Hồng Yến)
thaonphs170730@fpt.edu.vn( Nguyễn Phương Thảo)
trangnthhs170955@fpt.edu.vn( Nguyễn Thị Huyền Trang)
trangpthhs171282@fpt.edu.vn( Phạm Thị Huyền Trang)
huynvhs171289@fpt.edu.vn( Nguyễn Văn Huy)
tuanvmhs171370@fpt.edu.vn( Vũ Mạnh Tuấn)
ngoclthhs173009@fpt.edu.vn( Lão Thị Hoài Ngọc)
truongdxhs173034@fpt.edu.vn( Đặng Xuân Trường)
ngocdtbhs176119@fpt.edu.vn( Đinh Thị Bảo Ngọc)
linhdths176228@fpt.edu.vn( Đỗ Thuỳ Linh)
lamvths180087@fpt.edu.vn( Vũ Tùng Lâm)
hungtphs180150@fpt.edu.vn( Tiêu Phi Hùng)
ngocntphs180212@fpt.edu.vn( Nguyễn Trần Phương Ngọc)
thaobtths180294@fpt.edu.vn( Bùi Thị Thu Thảo)
longlths180310@fpt.edu.vn( Lê Thành Long)
tranghhhs180389@fpt.edu.vn( Hoàng Huyền Trang)
nguyetdtmhs180543@fpt.edu.vn( Đào Thị Minh Nguyệt)
thanhpths180662@fpt.edu.vn( Phạm Tuấn Thành)
phuongdtths180670@fpt.edu.vn( Đào Thị Thu Phương)
luongnhhs180676@fpt.edu.vn( Nguyễn Hiền Lương)
phuonglnhs180762@fpt.edu.vn( Lê Nguyên Phương)
minhlchs180899@fpt.edu.vn( Lê Công Minh)
thuynnhs181126@fpt.edu.vn( Nguyễn Ngọc Thuỷ)
khailqhs181176@fpt.edu.vn( Lê Quang Khải)
huyendkhs186085@fpt.edu.vn( Đỗ Khánh Huyền)
giangdhhhs186139@fpt.edu.vn( Đỗ Hồ Hương Giang)
phonghths186230@fpt.edu.vn( Hoàng Tuấn Phong)
haucths186235@fpt.edu.vn( Cao Tiến Hậu)
anhhtvhs186451@fpt.edu.vn( Hồ Trần Vân Anh)
gianglthss180166@fpt.edu.vn( Lê Thị Hương Giang)
`;

const generateRandomPhone = () => {
    const prefixes = ['09', '03', '08', '07', '05'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const digits = Math.floor(10000000 + Math.random() * 90000000);
    return prefix + digits.toString();
};

const generateRandomDate = () => {
    const start = new Date('2026-03-01T00:00:00Z').getTime();
    const end = new Date('2026-03-19T00:23:50Z').getTime();
    return new Date(start + Math.random() * (end - start));
};

async function run() {
    try {
        // Find existing to avoid bulkCreate errors on unique constraint
        const existingUsers = await User.findAll({ attributes: ['email'] });
        const existingEmails = new Set(existingUsers.map(u => u.email));

        const hash = await bcrypt.hash('123456', 10);
        const records = emails_names.trim().split('\n').map(line => {
            const match = line.match(/^([^\(]+)\(\s*([^\)]+?)\s*\)$/);
            if (!match) return null;
            const email = match[1].trim();
            const fullName = match[2].trim();
            const createdAt = generateRandomDate();
            
            if (existingEmails.has(email)) return null;

            return {
                email: email,
                full_name: fullName,
                phone_number: generateRandomPhone(),
                role_id: role_id,
                password_hash: hash,
                status: 'active',
                created_at: createdAt,
                updated_at: createdAt,
            };
        }).filter(Boolean);
        
        console.log(`Prepared ${records.length} users to insert. Inserting...`);
        if (records.length > 0) {
           await User.bulkCreate(records);
           console.log('Successfully inserted users!');
        } else {
           console.log('No new users to insert.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}
run();
