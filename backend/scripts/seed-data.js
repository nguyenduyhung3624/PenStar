import { faker } from "@faker-js/faker";
import pkg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

dotenv.config();
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============= CẤU HÌNH =============
const CONFIG = {
  USERS: 0,
  ROOM_TYPES: 6,
  ROOMS_PER_TYPE: 5,
  SERVICES: 15,
  BOOKINGS: 0,
  BOOKING_SERVICES_PER_BOOKING: 3,
  DISCOUNT_CODES: 0,
  FLOORS: 5,
  ROOM_TYPE_IMAGES: 5,
  ROOM_IMAGES: 3,
};

// ============= DỮ LIỆU CHUẨN KHÁCH SẠN VIỆT NAM =============

const ROOM_TYPES_DATA = [
  {
    name: "Standard",
    description:
      "Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho khách du lịch và công tác ngắn ngày.",
    capacity: 2,
    basePrice: 800000,
    roomSize: 25,
    bedType: "Giường đôi",
    viewDirection: "Hướng thành phố",
    baseAdults: 2,
    baseChildren: 0,
    extraAdultFee: 150000,
    extraChildFee: 100000,
  },
  {
    name: "Deluxe",
    description:
      "Phòng cao cấp với không gian rộng rãi, view đẹp và trang thiết bị hiện đại, lý tưởng cho kỳ nghỉ dưỡng.",
    capacity: 3,
    basePrice: 1200000,
    roomSize: 35,
    bedType: "Giường King",
    viewDirection: "Hướng biển",
    baseAdults: 2,
    baseChildren: 1,
    extraAdultFee: 200000,
    extraChildFee: 150000,
  },
  {
    name: "Superior",
    description:
      "Phòng hạng sang với thiết kế tinh tế, ban công riêng và view toàn cảnh thành phố.",
    capacity: 3,
    basePrice: 1500000,
    roomSize: 40,
    bedType: "Giường Queen",
    viewDirection: "Hướng sông",
    baseAdults: 2,
    baseChildren: 1,
    extraAdultFee: 250000,
    extraChildFee: 180000,
  },
  {
    name: "Suite",
    description:
      "Căn hộ suite với phòng khách riêng biệt, bếp nhỏ và không gian làm việc chuyên nghiệp.",
    capacity: 4,
    basePrice: 2500000,
    roomSize: 60,
    bedType: "Giường King + Sofa giường",
    viewDirection: "Hướng vườn",
    baseAdults: 2,
    baseChildren: 2,
    extraAdultFee: 300000,
    extraChildFee: 200000,
  },
  {
    name: "Executive Suite",
    description:
      "Suite điều hành cao cấp với phòng họp nhỏ, pantry và dịch vụ butler riêng.",
    capacity: 4,
    basePrice: 3500000,
    roomSize: 80,
    bedType: "Giường King + 2 Giường đơn",
    viewDirection: "Góc view toàn cảnh",
    baseAdults: 2,
    baseChildren: 2,
    extraAdultFee: 400000,
    extraChildFee: 250000,
  },
  {
    name: "Presidential Suite",
    description:
      "Phòng Tổng thống đỉnh cao sang trọng với 3 phòng ngủ, phòng ăn, phòng khách và dịch vụ 5 sao.",
    capacity: 6,
    basePrice: 8000000,
    roomSize: 150,
    bedType: "3 Giường King",
    viewDirection: "Penthouse view 360°",
    baseAdults: 4,
    baseChildren: 2,
    extraAdultFee: 500000,
    extraChildFee: 300000,
  },
];

const FREE_AMENITIES = [
  "WiFi tốc độ cao miễn phí",
  "Điều hòa nhiệt độ 2 chiều",
  "TV LED 55 inch",
  "Máy sấy tóc Panasonic",
  "Dép khách sạn cao cấp",
  "Nước suối Lavie miễn phí",
  "Bộ đồ vệ sinh cá nhân",
  "Dầu gội & sữa tắm Comfort",
  "Bộ khăn tắm cao cấp",
  "Tủ quần áo gỗ tự nhiên",
  "Bàn làm việc có đèn đọc sách",
  "Dọn phòng 2 lần/ngày",
  "Két sắt điện tử an toàn",
  "Điện thoại nội bộ",
  "Trà Lipton & cà phê G7",
  "Minibar tủ lạnh",
  "Vòi sen massage đa chức năng",
  "Ban công riêng",
  "Rèm cửa tự động",
];

const PAID_AMENITIES = [
  "Dịch vụ phòng 24/7",
  "Giặt là cao cấp",
  "Spa & Massage trị liệu",
  "Gym & Yoga",
  "Hồ bơi ngoài trời",
  "Đưa đón sân bay",
  "Thuê xe du lịch",
  "Buffet sáng quốc tế",
];

const SERVICE_NAMES = [
  { name: "Giặt ủi quần áo cao cấp", price: 50000, unit: "kg" },
  { name: "Dịch vụ phòng 24/7", price: 0, unit: "Lần" },
  { name: "Spa & Massage body", price: 500000, unit: "60 phút" },
  { name: "Phòng gym & yoga", price: 100000, unit: "Lượt" },
  { name: "Hồ bơi ngoài trời", price: 150000, unit: "Ngày" },
  { name: "Đưa đón sân bay (1 chiều)", price: 300000, unit: "Lượt" },
  { name: "Thuê xe 4 chỗ có tài xế", price: 1000000, unit: "Ngày" },
  { name: "Buffet sáng quốc tế", price: 200000, unit: "Người" },
  { name: "Set lunch Á - Âu", price: 250000, unit: "Người" },
  { name: "Gala dinner cao cấp", price: 500000, unit: "Người" },
  { name: "Tours tham quan thành phố", price: 400000, unit: "Người" },
  { name: "Phòng karaoke VIP", price: 300000, unit: "Giờ" },
  { name: "Sân tennis", price: 200000, unit: "Giờ" },
  { name: "Thuê hội trường 100 người", price: 2000000, unit: "Giờ" },
  { name: "Dịch vụ trông trẻ chuyên nghiệp", price: 150000, unit: "Giờ" },
  { name: "Phụ thu checkout muộn", price: 100000, unit: "Giờ" },
];

const EQUIPMENT_TYPES = [
  {
    name: "TV Samsung 55 inch Smart",
    type: "điện tử",
    import_price: 15000000,
    compensation_price: 12000000,
  },
  {
    name: "Điều hòa Daikin Inverter 12000BTU",
    type: "điện tử",
    import_price: 12000000,
    compensation_price: 10000000,
  },
  {
    name: "Tủ lạnh mini Aqua 50L",
    type: "điện tử",
    import_price: 5000000,
    compensation_price: 4000000,
  },
  {
    name: "Két sắt điện tử khách sạn",
    type: "an ninh",
    import_price: 3000000,
    compensation_price: 2500000,
  },
  {
    name: "Máy sấy tóc Panasonic",
    type: "phòng tắm",
    import_price: 500000,
    compensation_price: 400000,
  },
  {
    name: "Ấm đun nước Electrolux 1.7L",
    type: "nhà bếp",
    import_price: 800000,
    compensation_price: 600000,
  },
  {
    name: "Đèn ngủ LED cảm ứng",
    type: "nội thất",
    import_price: 300000,
    compensation_price: 200000,
  },
  {
    name: "Ghế sofa đơn giả da",
    type: "nội thất",
    import_price: 5000000,
    compensation_price: 4000000,
  },
  {
    name: "Bàn làm việc gỗ tự nhiên",
    type: "nội thất",
    import_price: 3000000,
    compensation_price: 2500000,
  },
  {
    name: "Giường King size 1.8m",
    type: "nội thất",
    import_price: 20000000,
    compensation_price: 15000000,
  },
  {
    name: "Nệm cao su thiên nhiên Dunlopillo",
    type: "nội thất",
    import_price: 8000000,
    compensation_price: 6000000,
  },
  {
    name: "Rèm cửa tự động điều khiển từ xa",
    type: "nội thất",
    import_price: 5000000,
    compensation_price: 4000000,
  },
  {
    name: "Gương trang điểm có đèn LED",
    type: "phòng tắm",
    import_price: 1500000,
    compensation_price: 1000000,
  },
  {
    name: "Bồn tắm massage Jacuzzi",
    type: "phòng tắm",
    import_price: 30000000,
    compensation_price: 25000000,
  },
  {
    name: "Vòi sen đa năng Rain Shower",
    type: "phòng tắm",
    import_price: 3000000,
    compensation_price: 2500000,
  },
  {
    name: "Máy lọc không khí Xiaomi",
    type: "điện tử",
    import_price: 4000000,
    compensation_price: 3000000,
  },
  {
    name: "Loa Bluetooth JBL Flip",
    type: "điện tử",
    import_price: 2000000,
    compensation_price: 1500000,
  },
  {
    name: "Đồng hồ báo thức kỹ thuật số",
    type: "điện tử",
    import_price: 500000,
    compensation_price: 300000,
  },
  {
    name: "Ly thủy tinh cao cấp",
    type: "đồ dùng",
    import_price: 50000,
    compensation_price: 30000,
  },
  {
    name: "Tranh canvas phong cảnh Việt Nam",
    type: "trang trí",
    import_price: 2000000,
    compensation_price: 1500000,
  },
];

const HOTEL_IMAGES = {
  rooms: [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
  ],
  services: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
  ],
};

// ============= HELPER FUNCTIONS =============

const getRandomImage = (category) => {
  const images = HOTEL_IMAGES[category] || HOTEL_IMAGES.rooms;
  return images[Math.floor(Math.random() * images.length)];
};

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function downloadImage(url, directory, prefix) {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${prefix}-${uniqueSuffix}.jpg`;
    const uploadPath = path.join(process.cwd(), "uploads", directory);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const writer = fs.createWriteStream(path.join(uploadPath, filename));
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(filename));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error.message);
    return null;
  }
}

// ============= DATABASE CONNECTION =============

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD || ""),
  database: process.env.DB_NAME,
});

// ============= SEEDING FUNCTIONS =============

async function resetUploads() {
  console.log("🗑️  Đang xóa thư mục uploads...");
  const uploadsPath = path.join(process.cwd(), "uploads");
  if (fs.existsSync(uploadsPath)) {
    fs.rmSync(uploadsPath, { recursive: true, force: true });
  }
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("✅ Đã reset thư mục uploads!");
}

async function clearData() {
  console.log("🗑️  Đang xóa dữ liệu cũ...");
  const tables = [
    "booking_bill_logs",
    "booking_service_logs",
    "booking_services",
    "booking_incidents",
    "booking_items",
    "bookings",
    "discount_code_usages",
    "discount_codes",
    "equipment_stock_logs",
    "room_devices",
    "room_type_equipments",
    "room_type_images",
    "rooms",
    "room_types",
    "refund_policies",
    "services",
    "master_equipments",
    "users",
    "floors",
    "stay_status",
    "roles",
  ];

  for (const table of tables) {
    await pool.query(`DELETE FROM ${table}`);
    await pool.query(`ALTER SEQUENCE IF EXISTS ${table}_id_seq RESTART WITH 1`);
  }
  console.log("✅ Đã xóa dữ liệu cũ!");
}

async function seedRoles() {
  console.log("👑 Đang tạo vai trò...");
  const roles = [
    { id: 1, name: "admin", description: "Quản trị viên" },
    { id: 2, name: "customer", description: "Khách hàng" },
  ];

  for (const role of roles) {
    await pool.query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [role.id, role.name, role.description]
    );
  }
  await pool.query(
    "SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles))"
  );
  console.log(`✅ Đã tạo ${roles.length} vai trò`);
}

async function seedStayStatus() {
  console.log("🏳️  Đang tạo trạng thái đặt phòng...");
  const statuses = [
    { id: 2, name: "confirmed", description: "Đã xác nhận" },
    { id: 3, name: "checked_in", description: "Đang lưu trú" },
    { id: 4, name: "checked_out", description: "Đã trả phòng" },
    { id: 5, name: "cancelled", description: "Đã hủy" },
    { id: 6, name: "no_show", description: "Không đến" },
    { id: 1, name: "pending", description: "Chờ thanh toán" },
  ];

  for (const status of statuses) {
    await pool.query(
      `INSERT INTO stay_status (id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name, description = EXCLUDED.description`,
      [status.id, status.name, status.description]
    );
  }
  await pool.query(
    "SELECT setval('stay_status_id_seq', (SELECT MAX(id) FROM stay_status))"
  );
  console.log(`✅ Đã tạo ${statuses.length} trạng thái`);
}

async function seedFloors() {
  console.log("🏢 Đang tạo tầng...");
  for (let i = 1; i <= CONFIG.FLOORS; i++) {
    await pool.query(
      `INSERT INTO floors (name, description)
       VALUES ($1, $2)`,
      [`Tầng ${i}`, `Tầng ${i} - Khách sạn PenStar`]
    );
  }
  console.log(`✅ Đã tạo ${CONFIG.FLOORS} tầng`);
}

async function seedUsers() {
  console.log("👥 Đang tạo người dùng...");
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Tạo 5 tài khoản admin
  const admins = [
    {
      name: "Nguyễn Duy Hưng",
      email: "nguyenduyhung3624@gmail.com",
      phone: "0901234567",
    },
    {
      name: "Văn Thắng",
      email: "vanthang8c231@gmail.com",
      phone: "0902345678",
    },
    {
      name: "Anh Tiến",
      email: "anhtien210204@gmail.com",
      phone: "0903456789",
    },
    {
      name: "Nguyễn Toàn",
      email: "ntoan200444@gmail.com",
      phone: "0904567890",
    },
    {
      name: "Nguyễn Văn Mạnh",
      email: "nguyenvanmanh11a7@gmail.com",
      phone: "0905678901",
    },
  ];

  for (const admin of admins) {
    await pool.query(
      `INSERT INTO users (full_name, email, password, phone, role_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [admin.name, admin.email, hashedPassword, admin.phone, 1, "active"]
    );
  }

  const vietnameseNames = [
    "Nguyễn Văn An",
    "Trần Thị Bình",
    "Lê Hoàng Cường",
    "Phạm Thu Dung",
    "Hoàng Minh Em",
  ];

  for (let i = 0; i < CONFIG.USERS - admins.length; i++) {
    const name = vietnameseNames[i % vietnameseNames.length];
    await pool.query(
      `INSERT INTO users (full_name, email, password, phone, role_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        name,
        `user${i + 1}@example.com`,
        hashedPassword,
        `09${faker.string.numeric(8)}`,
        2,
        "active",
      ]
    );
  }
  console.log(
    `✅ Đã tạo ${admins.length} admin và ${
      CONFIG.USERS - admins.length
    } khách hàng`
  );
}

async function seedMasterEquipments() {
  console.log("🔧 Đang tạo danh mục thiết bị...");
  for (const eq of EQUIPMENT_TYPES) {
    await pool.query(
      `INSERT INTO master_equipments (name, type, import_price, compensation_price, total_stock)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        eq.name,
        eq.type,
        eq.import_price,
        eq.compensation_price,
        getRandomNumber(50, 200),
      ]
    );
  }
  console.log(`✅ Đã tạo ${EQUIPMENT_TYPES.length} loại thiết bị`);
}

async function seedServices() {
  console.log("🛎️  Đang tạo dịch vụ...");
  for (const service of SERVICE_NAMES) {
    const imageUrl = getRandomImage("services");
    const localImage = await downloadImage(imageUrl, "services", "service");
    const finalImage = localImage || "placeholder.jpg";

    await pool.query(
      `INSERT INTO services (name, price, description, is_included, image_url, thumbnail, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        service.name,
        service.price,
        `Dịch vụ ${service.name} tại khách sạn PenStar`,
        service.price === 0,
        finalImage,
        finalImage,
        service.unit || "Lượt",
      ]
    );
  }
  console.log(`✅ Đã tạo ${SERVICE_NAMES.length} dịch vụ`);
}

async function seedRoomTypes() {
  console.log("🏨 Đang tạo loại phòng...");
  const roomTypeIds = [];

  for (const rtData of ROOM_TYPES_DATA) {
    const thumbUrl = getRandomImage("rooms");
    const localThumb = await downloadImage(thumbUrl, "rooms", "roomtype");
    const finalThumb = localThumb ? `/uploads/rooms/${localThumb}` : null;

    const freeAmenities = faker.helpers.arrayElements(
      FREE_AMENITIES,
      getRandomNumber(8, 12)
    );
    const paidAmenities = faker.helpers.arrayElements(
      PAID_AMENITIES,
      getRandomNumber(3, 6)
    );

    const result = await pool.query(
      `INSERT INTO room_types (
        name, description, thumbnail, capacity, price, bed_type,
        view_direction, free_amenities, paid_amenities, room_size,
        base_adults, base_children, extra_adult_fee, extra_child_fee, child_age_limit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        rtData.name,
        rtData.description,
        finalThumb,
        rtData.capacity,
        rtData.basePrice,
        rtData.bedType,
        rtData.viewDirection,
        freeAmenities,
        paidAmenities,
        rtData.roomSize,
        rtData.baseAdults,
        rtData.baseChildren,
        rtData.extraAdultFee,
        rtData.extraChildFee,
        12,
      ]
    );

    roomTypeIds.push(result.rows[0].id);

    // Thêm ảnh phòng
    for (let j = 0; j < CONFIG.ROOM_TYPE_IMAGES; j++) {
      const imgUrl = getRandomImage("rooms");
      const localImg = await downloadImage(imgUrl, "rooms", `${rtData.name}`);
      const finalImg = localImg ? `/uploads/rooms/${localImg}` : null;

      if (finalImg) {
        await pool.query(
          `INSERT INTO room_type_images (room_type_id, image_url, is_thumbnail)
           VALUES ($1, $2, $3)`,
          [result.rows[0].id, finalImg, j === 0]
        );
      }
    }

    // Thêm chính sách hoàn tiền
    await pool.query(
      `INSERT INTO refund_policies (room_type_id, refundable, refund_percent, refund_deadline_hours)
       VALUES ($1, $2, $3, $4)`,
      [result.rows[0].id, true, 80, 24]
    );
  }

  console.log(`✅ Đã tạo ${ROOM_TYPES_DATA.length} loại phòng`);
  return roomTypeIds;
}

async function seedRooms(roomTypeIds) {
  console.log("🚪 Đang tạo phòng...");
  const roomIds = [];
  const floorsResult = await pool.query("SELECT id FROM floors ORDER BY id");
  const floorIds = floorsResult.rows.map((f) => f.id);

  let roomNumber = 101;

  for (const typeId of roomTypeIds) {
    for (let i = 0; i < CONFIG.ROOMS_PER_TYPE; i++) {
      const floorIndex = Math.floor((roomNumber - 101) / 10) % floorIds.length;
      const floorId = floorIds[floorIndex] || floorIds[0];

      const result = await pool.query(
        `INSERT INTO rooms (name, type_id, status, floor_id, short_desc, long_desc)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          `Phòng ${roomNumber}`,
          typeId,
          "available",
          floorId,
          `Phòng ${roomNumber} tại tầng ${Math.ceil((roomNumber - 100) / 10)}`,
          `Phòng khách sạn hiện đại với đầy đủ tiện nghi cao cấp.`,
        ]
      );

      roomIds.push(result.rows[0].id);
      roomNumber++;
    }
  }

  console.log(`✅ Đã tạo ${roomIds.length} phòng`);
  return roomIds;
}

async function seedRoomTypeEquipments(roomTypeIds) {
  console.log("🛠️ Đang gán thiết bị chuẩn cho loại phòng...");
  const equipmentResult = await pool.query(
    "SELECT id, name, type, import_price FROM master_equipments"
  );
  const equipments = equipmentResult.rows;

  // Thiết bị cơ bản cho mọi loại phòng
  const basicEquipments = ["TV Samsung", "Điều hòa Daikin", "Giường", "Nệm"];

  for (let i = 0; i < roomTypeIds.length; i++) {
    const typeId = roomTypeIds[i];
    const numEquipments = 5 + i * 2; // Phòng cao cấp hơn có nhiều thiết bị hơn

    // Chọn thiết bị phù hợp với từng loại phòng
    const selectedEquipments = equipments.filter((eq) =>
      basicEquipments.some((basic) => eq.name.includes(basic))
    );

    // Thêm thêm thiết bị ngẫu nhiên
    const additionalEq = faker.helpers.arrayElements(
      equipments,
      Math.min(numEquipments - selectedEquipments.length, equipments.length)
    );

    for (const eq of [...selectedEquipments, ...additionalEq]) {
      await pool.query(
        `INSERT INTO room_type_equipments (room_type_id, name, quantity, price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [typeId, eq.name, getRandomNumber(1, 3), eq.import_price]
      );
    }
  }

  console.log(`✅ Đã gán thiết bị cho ${roomTypeIds.length} loại phòng`);
}

async function seedRoomDevices(roomIds) {
  console.log("🔌 Đang tạo thiết bị thực tế trong phòng...");
  const equipmentResult = await pool.query(
    "SELECT id, name, type FROM master_equipments"
  );
  const allMasterEquipments = equipmentResult.rows;

  let deviceCount = 0;

  for (const roomId of roomIds) {
    // Mỗi phòng sẽ có một bộ thiết bị chuẩn
    const numDevices = getRandomNumber(8, 15);
    const selectedDevices = faker.helpers.arrayElements(
      allMasterEquipments,
      Math.min(numDevices, allMasterEquipments.length)
    );

    for (const eq of selectedDevices) {
      const qty = eq.name.includes("Ly") ? getRandomNumber(4, 6) : 1;

      await pool.query(
        `INSERT INTO room_devices (master_equipment_id, device_name, device_type, status, room_id, quantity, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [eq.id, eq.name, eq.type || "general", "working", roomId, qty, null]
      );
      deviceCount++;
    }
  }

  console.log(`✅ Đã tạo ${deviceCount} thiết bị trong phòng`);
}

async function seedDiscountCodes() {
  console.log("🎫 Đang tạo mã giảm giá...");
  const vouchers = [
    {
      name: "Khách mới giảm 20%",
      code: "NEWUSER20",
      type: "percent",
      value: 20,
      max_discount_amount: 500000,
      min_total: 1000000,
      max_uses: 1000,
      max_uses_per_user: 1,
    },
    {
      name: "Giảm 30% sinh nhật",
      code: "BIRTHDAY30",
      type: "percent",
      value: 30,
      max_discount_amount: 1000000,
      min_total: 2000000,
      max_uses: 500,
      max_uses_per_user: 1,
    },
    {
      name: "Giảm 500K đặt phòng",
      code: "FLAT500K",
      type: "fixed",
      value: 500000,
      max_discount_amount: 0,
      min_total: 2000000,
      max_uses: 200,
      max_uses_per_user: 2,
    },
  ];

  for (const v of vouchers) {
    await pool.query(
      `INSERT INTO discount_codes (
        name, code, type, value, min_total, max_uses, max_uses_per_user,
        max_discount_amount, start_date, end_date, status, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        v.name,
        v.code,
        v.type,
        v.value,
        v.min_total,
        v.max_uses,
        v.max_uses_per_user,
        v.max_discount_amount,
        new Date("2025-01-01"),
        new Date("2026-12-31"),
        "active",
        `Mã giảm giá ${v.name}`,
      ]
    );
  }

  console.log(`✅ Đã tạo ${vouchers.length} mã giảm giá`);
}

async function main() {
  console.log("🚀 BẮT ĐẦU TẠO DỮ LIỆU MẪU\n");
  console.log("⚙️  Cấu hình:");
  console.log(JSON.stringify(CONFIG, null, 2));
  console.log("\n");

  try {
    await resetUploads();
    await clearData();
    await seedRoles();
    await seedStayStatus();
    await seedFloors();
    await seedUsers();
    await seedMasterEquipments();
    await seedServices();
    const roomTypeIds = await seedRoomTypes();
    const roomIds = await seedRooms(roomTypeIds);
    await seedRoomTypeEquipments(roomTypeIds);
    await seedRoomDevices(roomIds);
    await seedDiscountCodes();

    console.log("\n🎉 HOÀN TẤT TẠO DỮ LIỆU!");
    console.log("\n📊 Tổng kết:");
    console.log(`   - Người dùng: ${CONFIG.USERS}`);
    console.log(`   - Loại phòng: ${CONFIG.ROOM_TYPES}`);
    console.log(`   - Số phòng: ${CONFIG.ROOM_TYPES * CONFIG.ROOMS_PER_TYPE}`);
    console.log(`   - Dịch vụ: ${SERVICE_NAMES.length}`);
    console.log(`   - Thiết bị: ${EQUIPMENT_TYPES.length}`);
    console.log(`   - Mã giảm giá: 3`);
    console.log("\n✅ Tài khoản admin:");
    console.log("   Email: nguyenduyhung3624@gmail.com");
    console.log("   Password: 123456");
  } catch (error) {
    console.error("❌ Lỗi khi tạo dữ liệu:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

main();
