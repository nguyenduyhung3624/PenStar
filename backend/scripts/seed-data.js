import { faker } from "@faker-js/faker";
import pkg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();
const { Pool } = pkg;
const CONFIG = {
  USERS: 50,
  ROOM_TYPES: 6,
  ROOMS_PER_TYPE: 5,
  SERVICES: 15,
  MASTER_EQUIPMENTS: 20,
  BOOKINGS: 20,
  BOOKING_SERVICES_PER_BOOKING: 3,
  DISCOUNT_CODES: 10,
  FLOORS: 5,
  ROOM_TYPE_IMAGES: 5,
  ROOM_IMAGES: 3,
};
const HOTEL_IMAGES = {
  rooms: [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
  ],
  lobby: [
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800",
  ],
  services: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
  ],
  bathroom: [
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800",
  ],
};
const getRandomImage = (category) => {
  const images = HOTEL_IMAGES[category] || HOTEL_IMAGES.rooms;
  return images[Math.floor(Math.random() * images.length)];
};
const getRandomImages = (category, count) => {
  const images = [];
  for (let i = 0; i < count; i++) {
    images.push(getRandomImage(category));
  }
  return images;
};
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const ROOM_TYPE_NAMES = [
  "Standard",
  "Deluxe",
  "Superior",
  "Suite",
  "Executive Suite",
  "Presidential Suite",
];
const BED_TYPES = ["Single", "Double", "Queen", "King", "Twin", "Sofa Bed"];
const VIEW_DIRECTIONS = [
  "City View",
  "Ocean View",
  "Garden View",
  "Pool View",
  "Mountain View",
  "River View",
];
// Danh sách tiện nghi miễn phí phổ biến khi đặt phòng khách sạn
const FREE_AMENITIES = [
  "WiFi miễn phí",
  "Điều hòa nhiệt độ",
  "TV màn hình phẳng",
  "Máy sấy tóc",
  "Dép đi trong phòng",
  "Nước suối miễn phí",
  "Bàn chải & kem đánh răng",
  "Dầu gội & sữa tắm",
  "Khăn tắm",
  "Tủ quần áo",
  "Bàn làm việc",
  "Dọn phòng hàng ngày",
  "Két an toàn",
  "Điện thoại",
  "Trà & cà phê",
  "Bồn tắm",
  "Vòi sen",
  "Ban công",
];
const PAID_AMENITIES = [
  "Dịch vụ phòng 24/7",
  "Giặt ủi",
  "Spa",
  "Gym",
  "Hồ bơi",
  "Đưa đón sân bay",
  "Thuê xe",
  "Bữa sáng buffet",
];
const SERVICE_NAMES = [
  { name: "Giặt ủi quần áo", price: 50000, unit: "kg" },
  { name: "Dịch vụ phòng 24/7", price: 0, unit: "Lần" },
  { name: "Spa & Massage", price: 500000, unit: "Suất" },
  { name: "Gym & Fitness", price: 100000, unit: "Lượt" },
  { name: "Hồ bơi", price: 150000, unit: "Vé" },
  { name: "Đưa đón sân bay", price: 300000, unit: "Lượt" },
  { name: "Thuê xe du lịch", price: 1000000, unit: "Ngày" },
  { name: "Bữa sáng buffet", price: 200000, unit: "Suất" },
  { name: "Bữa trưa set menu", price: 250000, unit: "Suất" },
  { name: "Bữa tối gala", price: 500000, unit: "Suất" },
  { name: "Tour city", price: 400000, unit: "Tour" },
  { name: "Karaoke", price: 300000, unit: "Giờ" },
  { name: "Mini golf", price: 200000, unit: "Lượt" },
  { name: "Thuê phòng họp", price: 2000000, unit: "Giờ" },
  { name: "Dịch vụ trông trẻ", price: 150000, unit: "Giờ" },
];
const EQUIPMENT_TYPES = [
  {
    name: "TV Samsung 55 inch",
    type: "electronics",
    import_price: 15000000,
    compensation_price: 12000000,
  },
  {
    name: "Điều hòa Daikin 12000BTU",
    type: "electronics",
    import_price: 12000000,
    compensation_price: 10000000,
  },
  {
    name: "Tủ lạnh mini Panasonic",
    type: "electronics",
    import_price: 5000000,
    compensation_price: 4000000,
  },
  {
    name: "Két sắt điện tử",
    type: "security",
    import_price: 3000000,
    compensation_price: 2500000,
  },
  {
    name: "Máy sấy tóc Philips",
    type: "bathroom",
    import_price: 500000,
    compensation_price: 400000,
  },
  {
    name: "Ấm đun nước Electrolux",
    type: "kitchen",
    import_price: 800000,
    compensation_price: 600000,
  },
  {
    name: "Đèn ngủ IKEA",
    type: "furniture",
    import_price: 300000,
    compensation_price: 200000,
  },
  {
    name: "Ghế sofa đơn",
    type: "furniture",
    import_price: 5000000,
    compensation_price: 4000000,
  },
  {
    name: "Bàn làm việc",
    type: "furniture",
    import_price: 3000000,
    compensation_price: 2500000,
  },
  {
    name: "Giường đôi King size",
    type: "furniture",
    import_price: 20000000,
    compensation_price: 15000000,
  },
  {
    name: "Nệm cao cấp",
    type: "furniture",
    import_price: 8000000,
    compensation_price: 6000000,
  },
  {
    name: "Rèm cửa tự động",
    type: "furniture",
    import_price: 5000000,
    compensation_price: 4000000,
  },
  {
    name: "Gương trang điểm LED",
    type: "bathroom",
    import_price: 1500000,
    compensation_price: 1000000,
  },
  {
    name: "Bồn tắm massage",
    type: "bathroom",
    import_price: 30000000,
    compensation_price: 25000000,
  },
  {
    name: "Vòi sen cao cấp",
    type: "bathroom",
    import_price: 3000000,
    compensation_price: 2500000,
  },
  {
    name: "Máy lọc không khí",
    type: "electronics",
    import_price: 4000000,
    compensation_price: 3000000,
  },
  {
    name: "Loa Bluetooth JBL",
    type: "electronics",
    import_price: 2000000,
    compensation_price: 1500000,
  },
  {
    name: "Đồng hồ báo thức",
    type: "electronics",
    import_price: 500000,
    compensation_price: 300000,
  },
  {
    name: "Bình hoa trang trí",
    type: "decor",
    import_price: 500000,
    compensation_price: 300000,
  },
  {
    name: "Tranh treo tường",
    type: "decor",
    import_price: 2000000,
    compensation_price: 1500000,
  },
];
const BOOKING_METHODS = ["website", "phone", "walk-in", "ota", "agency"];
const PAYMENT_METHODS = ["cash", "card", "transfer", "momo", "vnpay"];
const PAYMENT_STATUSES = ["unpaid", "partial", "paid"];
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
async function clearData() {
  console.log("🗑️  Clearing existing data...");
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
    "room_type_equipments",
    "room_type_images",
    "rooms",
    "room_types",
    "refund_policies",
    "services",
    "master_equipments",
    "master_equipments",
    "users",
    "roles",
    "stay_status",
  ];
  for (const table of tables) {
    await pool.query(`DELETE FROM ${table}`);
    await pool.query(`ALTER SEQUENCE IF EXISTS ${table}_id_seq RESTART WITH 1`);
  }
  console.log("✅ Data cleared!");
}
async function seedUsers() {
  console.log("👥 Seeding users...");
  const users = [];
  const hashedPassword = await bcrypt.hash("123456", 10);
  // Create 1 admin
  users.push({
    full_name: "Admin PenStar",
    email: "nguyenduyhung3624@gmail.com",
    password: hashedPassword,
    phone: "0901234567",
    role_id: 1, // admin
    status: "active",
  });

  // Create customers
  for (let i = 0; i < CONFIG.USERS - 1; i++) {
    users.push({
      full_name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: hashedPassword,
      phone: `09${faker.string.numeric(8)}`,
      role_id: 2, // customer
      status: getRandomElement(["active", "active", "active", "banned"]),
    });
  }
  for (const user of users) {
    await pool.query(
      `INSERT INTO users (full_name, email, password, phone, role_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.full_name,
        user.email,
        user.password,
        user.phone,
        user.role_id,
        user.status,
      ]
    );
  }
  console.log(`✅ Created ${users.length} users`);
}

async function seedRoles() {
  console.log("👑 Seeding roles...");
  const roles = [
    { id: 1, name: "admin", description: "Administrator" },
    { id: 2, name: "customer", description: "Customer" },
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
  console.log(`✅ Created ${roles.length} roles`);
}

async function seedStayStatus() {
  console.log("🏳️  Seeding stay status...");
  const statuses = [
    { id: 1, name: "pending", description: "Pending confirmation" },
    { id: 2, name: "confirmed", description: "Booking confirmed" },
    { id: 3, name: "checked_in", description: "Guest checked in" },
    { id: 4, name: "checked_out", description: "Guest checked out" },
    { id: 5, name: "cancelled", description: "Booking cancelled" },
    { id: 6, name: "no_show", description: "Guest did not show up" },
  ];

  for (const status of statuses) {
    await pool.query(
      `INSERT INTO stay_status (id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [status.id, status.name, status.description]
    );
  }
  await pool.query(
    "SELECT setval('stay_status_id_seq', (SELECT MAX(id) FROM stay_status))"
  );
  console.log(`✅ Created ${statuses.length} stay statuses`);
}
async function seedMasterEquipments() {
  console.log("🔧 Seeding master equipments...");
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
  console.log(`✅ Created ${EQUIPMENT_TYPES.length} master equipments`);
}
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to download image
async function downloadImage(url, directory, prefix) {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${prefix}-${uniqueSuffix}.jpg`;
    const uploadPath = path.join(process.cwd(), "uploads", directory); // Use process.cwd() to be relative to backend root

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

async function seedServices() {
  console.log("🛎️  Seeding services...");
  for (const service of SERVICE_NAMES) {
    const imageUrl = getRandomImage("services");
    const localImage = await downloadImage(imageUrl, "services", "service");

    // If download fails, fallback to a placeholder or null, but prefer skipping or using a default if possible.
    // Ensure we handle null if download fails.
    const finalImage = localImage || "placeholder.jpg";

    await pool.query(
      `INSERT INTO services (name, price, description, is_included, image_url, thumbnail, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        service.name,
        service.price,
        faker.lorem.sentence(),
        service.price === 0,
        finalImage, // Use local filename
        finalImage, // Use local filename
        service.unit || "Cái",
      ]
    );
  }
  console.log(`✅ Created ${SERVICE_NAMES.length} services`);
}
async function seedRoomTypes() {
  console.log("🏨 Seeding room types...");
  const roomTypeIds = [];
  for (let i = 0; i < CONFIG.ROOM_TYPES; i++) {
    const name = ROOM_TYPE_NAMES[i] || `Room Type ${i + 1}`;
    const basePrice = (i + 1) * 500000 + getRandomNumber(100000, 300000);
    const freeAmenities = faker.helpers.arrayElements(
      FREE_AMENITIES,
      getRandomNumber(4, 8)
    );
    const paidAmenities = faker.helpers.arrayElements(
      PAID_AMENITIES,
      getRandomNumber(2, 5)
    );

    // Download thumbnail for room type
    const thumbUrl = getRandomImage("rooms");
    const localThumb = await downloadImage(thumbUrl, "rooms", "roomtype-thumb");
    const finalThumb = localThumb ? `/uploads/rooms/${localThumb}` : null;

    const result = await pool.query(
      `INSERT INTO room_types (
        name, description, thumbnail, capacity, price, bed_type,
        view_direction, free_amenities, paid_amenities, room_size,
        base_adults, base_children, extra_adult_fee, extra_child_fee, child_age_limit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        name,
        faker.lorem.paragraph(),
        finalThumb, // Use localized path with /uploads/rooms/ prefix
        getRandomNumber(2, 6),
        basePrice,
        getRandomElement(BED_TYPES),
        getRandomElement(VIEW_DIRECTIONS),
        freeAmenities,
        paidAmenities,
        getRandomNumber(25, 80),
        getRandomNumber(1, 3),
        getRandomNumber(0, 2),
        basePrice * 0.2,
        basePrice * 0.1,
        12,
      ]
    );
    roomTypeIds.push(result.rows[0].id);
    const images = getRandomImages("rooms", CONFIG.ROOM_TYPE_IMAGES);
    for (let j = 0; j < images.length; j++) {
      // Download additional room images
      const imgUrl = images[j];
      const localImg = await downloadImage(imgUrl, "rooms", "roomtype-img");
      const finalImg = localImg ? `/uploads/rooms/${localImg}` : null;

      if (finalImg) {
        await pool.query(
          `INSERT INTO room_type_images (room_type_id, image_url, is_thumbnail)
             VALUES ($1, $2, $3)`,
          [result.rows[0].id, finalImg, j === 0]
        );
      }
    }
    await pool.query(
      `INSERT INTO refund_policies (room_type_id, refundable, refund_percent, refund_deadline_hours)
       VALUES ($1, $2, $3, $4)`,
      [
        result.rows[0].id,
        true,
        getRandomNumber(50, 100),
        getRandomNumber(24, 72),
      ]
    );
  }
  console.log(`✅ Created ${CONFIG.ROOM_TYPES} room types`);
  return roomTypeIds;
}
async function seedRooms(roomTypeIds) {
  console.log("🚪 Seeding rooms...");
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
          getRandomElement([
            "available",
            "available",
            "available",
            "maintenance",
          ]),
          floorId,
          faker.lorem.sentence(),
          faker.lorem.paragraph(),
        ]
      );
      roomIds.push(result.rows[0].id);

      // Removed room_images seeding since the table is deleted
      roomNumber++;
    }
  }
  console.log(`✅ Created ${roomIds.length} rooms`);
  return roomIds;
}
async function seedRoomTypeEquipments(roomTypeIds) {
  console.log("🛠️ Seeding room type equipments...");
  const equipmentResult = await pool.query(
    "SELECT id, name, type FROM master_equipments ORDER BY id"
  );
  const equipments = equipmentResult.rows;
  if (equipments.length === 0) {
    console.log("⚠️ No master equipments found, skipping room type equipments");
    return;
  }
  for (const typeId of roomTypeIds) {
    const numEquipments = getRandomNumber(3, 8);
    const selectedEquipments = faker.helpers.arrayElements(
      equipments,
      Math.min(numEquipments, equipments.length)
    );
    for (const eq of selectedEquipments) {
      const qty = getRandomNumber(1, 4);
      await pool.query(
        `INSERT INTO room_type_equipments (room_type_id, equipment_type_id, quantity)
         VALUES ($1, $2, $3)`,
        [typeId, eq.id, qty]
      );
    }
  }
  console.log(`✅ Created equipments for ${roomTypeIds.length} room types`);
}
async function seedRoomDevices(roomIds) {
  console.log("🔌 Seeding room devices...");

  // Get all rooms with their types
  const roomsRes = await pool.query(
    "SELECT id, type_id FROM rooms WHERE id = ANY($1)",
    [roomIds]
  );
  const rooms = roomsRes.rows;

  let deviceCount = 0;

  for (const room of rooms) {
    // Get authorized equipment for this room type
    const authorizedEquipmentsRes = await pool.query(
      `SELECT rte.equipment_type_id, rte.quantity as standard_qty, me.name, me.type
       FROM room_type_equipments rte
       JOIN master_equipments me ON rte.equipment_type_id = me.id
       WHERE rte.room_type_id = $1`,
      [room.type_id]
    );

    // If no specific equipment defined, skip or use a default subset?
    // User wants it to match room type, so if empty, then room has no devices.
    const authorizedEquipments = authorizedEquipmentsRes.rows;

    for (const eq of authorizedEquipments) {
      await pool.query(
        `INSERT INTO room_devices (master_equipment_id, device_name, device_type, status, room_id, quantity, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          eq.equipment_type_id,
          `${eq.name} - Room ${room.id}`,
          eq.type || "general",
          "working", // Always create devices with working status
          room.id,
          eq.standard_qty || 1, // Use the standard quantity defined in room type
          faker.datatype.boolean() ? faker.lorem.sentence() : null,
        ]
      );
      deviceCount++;
    }
  }
  console.log(`✅ Created ${deviceCount} room devices matching room types`);
}
async function seedDiscountCodes() {
  console.log("🎫 Seeding discount codes...");
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
    {
      name: "VIP Member 15%",
      code: "VIP15",
      type: "percent",
      value: 15,
      max_discount_amount: 800000,
      min_total: 500000,
      max_uses: 9999,
      max_uses_per_user: 10,
    },
    {
      name: "Flash Sale 25%",
      code: "FLASH25",
      type: "percent",
      value: 25,
      max_discount_amount: 600000,
      min_total: 1500000,
      max_uses: 50,
      max_uses_per_user: 1,
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
        faker.date.past(),
        faker.date.future({ years: 1 }),
        "active",
        faker.lorem.sentence(),
      ]
    );
  }
  const types = ["percent", "fixed"];
  for (let i = 0; i < CONFIG.DISCOUNT_CODES - vouchers.length; i++) {
    const type = getRandomElement(types);
    const value =
      type === "percent"
        ? getRandomNumber(5, 30)
        : getRandomNumber(50000, 500000);
    const maxDiscountAmount =
      type === "percent" ? getRandomNumber(200000, 1000000) : 0;
    await pool.query(
      `INSERT INTO discount_codes (
        name, code, type, value, min_total, max_uses, max_uses_per_user,
        max_discount_amount, start_date, end_date, status, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        `Voucher ${faker.string.alphanumeric(4).toUpperCase()}`,
        faker.string.alphanumeric(8).toUpperCase(),
        type,
        value,
        type === "percent" ? 500000 : 1000000,
        getRandomNumber(10, 100),
        getRandomNumber(1, 3),
        maxDiscountAmount,
        faker.date.past(),
        faker.date.future(),
        getRandomElement(["active", "active", "inactive"]),
        faker.lorem.sentence(),
      ]
    );
  }
  console.log(`✅ Created ${CONFIG.DISCOUNT_CODES} discount codes`);
}
async function seedBookings(roomIds) {
  console.log("📋 Seeding bookings...");
  const usersResult = await pool.query(
    "SELECT id FROM users WHERE role_id = 2"
  );
  const userIds = usersResult.rows.map((u) => u.id);
  const statusResult = await pool.query("SELECT id, name FROM stay_status");
  const stayStatuses = statusResult.rows;
  const servicesResult = await pool.query("SELECT id, price FROM services");
  const services = servicesResult.rows;
  const roomTypesResult = await pool.query("SELECT id, price FROM room_types");
  const roomTypePrices = {};
  roomTypesResult.rows.forEach((rt) => {
    roomTypePrices[rt.id] = rt.price;
  });
  const roomsResult = await pool.query("SELECT id, type_id FROM rooms");
  const roomTypeMap = {};
  roomsResult.rows.forEach((r) => {
    roomTypeMap[r.id] = r.type_id;
  });
  for (let i = 0; i < CONFIG.BOOKINGS; i++) {
    const userId = getRandomElement(userIds);
    const stayStatus = getRandomElement(stayStatuses);
    const checkIn = faker.date.between({
      from: "2025-01-01",
      to: "2026-06-30",
    });
    const nights = getRandomNumber(1, 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    const selectedRoomId = getRandomElement(roomIds);
    const roomTypeId = roomTypeMap[selectedRoomId];
    const roomPrice = roomTypePrices[roomTypeId] || 1000000;
    const totalPrice = roomPrice * nights;
    const bookingResult = await pool.query(
      `INSERT INTO bookings (
        customer_name, total_price, payment_status, booking_method,
        stay_status_id, user_id, notes, payment_method, discount_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        faker.person.fullName(),
        totalPrice,
        getRandomElement(PAYMENT_STATUSES),
        getRandomElement(BOOKING_METHODS),
        stayStatus.id,
        userId,
        faker.lorem.sentence(),
        getRandomElement(PAYMENT_METHODS),
        getRandomNumber(0, Math.floor(totalPrice * 0.1)),
      ]
    );
    const bookingId = bookingResult.rows[0].id;
    const bookingItemResult = await pool.query(
      `INSERT INTO booking_items (
        booking_id, room_id, check_in, check_out, num_adults, num_children,
        special_requests, room_type_id, room_type_price, quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        bookingId,
        selectedRoomId,
        checkIn,
        checkOut,
        getRandomNumber(1, 3),
        getRandomNumber(0, 2),
        faker.lorem.sentence(),
        roomTypeId,
        roomPrice,
        1,
      ]
    );
    const bookingItemId = bookingItemResult.rows[0].id;
    const numServices = getRandomNumber(0, CONFIG.BOOKING_SERVICES_PER_BOOKING);
    const selectedServices = faker.helpers.arrayElements(services, numServices);
    for (const service of selectedServices) {
      const quantity = getRandomNumber(1, 3);
      await pool.query(
        `INSERT INTO booking_services (booking_id, service_id, quantity, total_service_price, booking_item_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          bookingId,
          service.id,
          quantity,
          service.price * quantity,
          bookingItemId,
        ]
      );
    }
  }
  console.log(`✅ Created ${CONFIG.BOOKINGS} bookings`);
}
async function resetUploads() {
  console.log("-----");
  console.log("🗑️  Resetting uploads folder...");
  const uploadsPath = path.join(process.cwd(), "uploads");
  if (fs.existsSync(uploadsPath)) {
    fs.rmSync(uploadsPath, { recursive: true, force: true });
  }
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("✅ Uploads folder reset!");
}

async function main() {
  console.log("🚀 Starting data seeding...\n");
  console.log("Configuration:");
  console.log(JSON.stringify(CONFIG, null, 2));
  console.log("\n");
  try {
    await resetUploads();
    await clearData();
    await seedRoles();
    await seedStayStatus();
    await seedUsers();
    await seedMasterEquipments();
    await seedServices();
    const roomTypeIds = await seedRoomTypes();
    const roomIds = await seedRooms(roomTypeIds);
    await seedRoomTypeEquipments(roomTypeIds);
    await seedRoomDevices(roomIds);
    await seedDiscountCodes();
    await seedBookings(roomIds);
    console.log("\n🎉 Data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${CONFIG.USERS}`);
    console.log(`   - Room Types: ${CONFIG.ROOM_TYPES}`);
    console.log(`   - Rooms: ${CONFIG.ROOM_TYPES * CONFIG.ROOMS_PER_TYPE}`);
    console.log(`   - Services: ${SERVICE_NAMES.length}`);
    console.log(`   - Equipments: ${EQUIPMENT_TYPES.length}`);
    console.log(`   - Bookings: ${CONFIG.BOOKINGS}`);
    console.log(`   - Discount Codes: ${CONFIG.DISCOUNT_CODES}`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await pool.end();
  }
}
main();
