const PDFDocument = require("pdfkit");
const path = require("path");

// Sắp xếp mức độ nghiêm trọng của tương tác thuốc
const severityRank = (s) => {
  const v = String(s || "").toLowerCase();
  const order = { contraindicated: 4, severe: 3, moderate: 2, mild: 1 };
  return order[v] || 0;
};

// Hàm xử lý text null/undefined
const safeText = (v) => (v == null ? "-" : String(v));

const buildPatientProfilePdfBuffer = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 36 });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ✅ Bắt buộc phải có font hỗ trợ tiếng Việt (UTF-8)
      const fontPath = "/opt/fonts/DejaVuSans.ttf";

      if (require("fs").existsSync(fontPath)) {
        doc.registerFont("DejaVu", fontPath);
        doc.font("DejaVu");
      } else {
        console.warn("Không tìm thấy file font:", fontPath);
        doc.font("Helvetica"); // Sẽ bị lỗi font tiếng Việt nếu rơi vào trường hợp này
      }

      // --- Tiêu đề báo cáo (Header) ---
      doc
        .fontSize(18)
        .text("CareDose — Báo Cáo Hồ Sơ Sức Khỏe", { align: "center" });
      doc.moveDown(0.5);

      // Chuyển đổi định dạng ngày giờ cho dễ đọc hơn
      const generatedDate = new Date().toLocaleString("vi-VN");
      doc.fontSize(10).text(`Ngày tạo: ${generatedDate}`, { align: "center" });
      doc.moveDown();

      // --- Thông tin người dùng (Patient Info) ---
      const p = data.profile || {};
      doc.fontSize(12).text("Thông Tin Người Dùng", { underline: true });
      doc.moveDown(0.3);
      doc
        .fontSize(11)
        .text(`Họ và tên: ${safeText(p.full_name)}`)
        .text(`Ngày sinh: ${safeText(p.date_of_birth)}`)
        .text(`Giới tính: ${safeText(p.sex)}`)
        .text(`Mối quan hệ: ${safeText(p.relationship_to_owner)}`)
        .text(`Ghi chú: ${safeText(p.notes)}`);
      doc.moveDown();

      // --- Danh sách thuốc đang dùng (Active Medications) ---
      doc.fontSize(12).text("Thuốc Đang Sử Dụng", { underline: true });
      doc.moveDown(0.5);

      const startX = doc.x;
      const col1 = startX;
      const col2 = startX + 240;
      const col3 = startX + 380;

      // Tiêu đề cột
      doc.fontSize(10).text("Tên Thuốc", col1);
      doc.text("Lịch Uống", col2);
      doc.text("Thời Gian", col3);
      doc.moveDown(0.3);
      doc.moveTo(startX, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.3);

      const regimens = Array.isArray(data.regimens) ? data.regimens : [];
      if (regimens.length === 0) {
        doc.fontSize(10).text("(Không có đơn thuốc nào đang hoạt động)");
      } else {
        for (const r of regimens.slice(0, 20)) {
          const dp = r.drugProduct || {};
          const medName = dp.brand_name
            ? `${dp.brand_name}${dp.strength_text ? " — " + dp.strength_text : ""}`
            : safeText(r.display_name);

          const times = r?.schedule_payload?.times;
          const schedule =
            Array.isArray(times) && times.length
              ? `Cố định: ${times.join(", ")}`
              : safeText(r.schedule_type);

          const duration = `${safeText(r.start_date)} → ${safeText(r.end_date)}`;

          const y = doc.y;
          doc.fontSize(10).text(medName, col1, y, { width: 230 });
          doc.text(schedule, col2, y, { width: 130 });
          doc.text(duration, col3, y, { width: 170 });
          doc.moveDown(0.8);

          // Sang trang mới nếu hết chỗ
          if (doc.y > 740) doc.addPage();
        }
      }
      doc.moveDown();

      // --- Cảnh báo an toàn (Safety Alerts) ---
      doc.fontSize(12).text("Cảnh Báo Tương Tác Thuốc", { underline: true });
      doc.moveDown(0.4);

      const interactions = Array.isArray(data?.warnings?.interactions)
        ? [...data.warnings.interactions]
        : [];
      interactions.sort(
        (a, b) => severityRank(b.severity) - severityRank(a.severity),
      );

      if (interactions.length === 0) {
        doc
          .fontSize(10)
          .text("(Không phát hiện tương tác thuốc nghiêm trọng nào)");
      } else {
        const top = interactions.slice(0, 5);
        // Có thể cân nhắc dịch cả mức độ (severity) nếu dữ liệu trả về tiếng Anh
        const severityVi = {
          contraindicated: "Chống chỉ định",
          severe: "Nghiêm trọng",
          moderate: "Trung bình",
          mild: "Nhẹ",
        };

        for (const it of top) {
          const s1 = it.substance_1?.name || "-";
          const s2 = it.substance_2?.name || "-";
          const sev =
            severityVi[it.severity.toLowerCase()] || safeText(it.severity);
          doc.fontSize(10).text(`• [${sev}] ${s1} ↔ ${s2}`);
        }
      }
      doc.moveDown();

      // --- Thống kê tuân thủ (Adherence summary) ---
      doc
        .fontSize(12)
        .text(`Mức Độ Tuân Thủ (Trong ${safeText(data.rangeDays)} ngày qua)`, {
          underline: true,
        });
      doc.moveDown(0.4);

      const a = data.adherence || {};
      doc
        .fontSize(10)
        .text(
          `Đã uống: ${safeText(a.taken)} | Bỏ qua: ${safeText(a.skipped)} | Uống trễ: ${safeText(a.delayed)} | Không rõ: ${safeText(a.unknown)}`,
        )
        .text(
          `Tổng số liều: ${safeText(a.total)} | Tỷ lệ tuân thủ: ${safeText(a.takenPercent)}%`,
        );

      doc.moveDown(1);

      // --- Tuyên bố miễn trừ trách nhiệm (Disclaimer) ---
      doc
        .fontSize(9)
        .text(
          "Lưu ý: Báo cáo này chỉ đóng vai trò hỗ trợ quản lý thông tin, không mang tính chất tư vấn, chẩn đoán và tuyệt đối không thay thế y lệnh của bác sĩ điều trị.",
          {
            align: "left",
          },
        );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = { buildPatientProfilePdfBuffer };
