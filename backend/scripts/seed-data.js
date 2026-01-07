/**
 * Seed Data Script for PenStar Hotel Management System
 * Uses faker.js to generate realistic fake data
 *
 * Usage: node scripts/seed-data.js
 */

import { faker } from "@faker-js/faker";
import pkg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const { Pool } = pkg;

// =============================================
// CONFIGURATION - Adjust these to control data volume
// =============================================
const CONFIG = {
  // Number of records to generate
  USERS: 50,
  ROOM_TYPES: 6,
  ROOMS_PER_TYPE: 5,
  SERVICES: 15,
  MASTER_EQUIPMENTS: 20,
  BOOKINGS: 100,
  BOOKING_SERVICES_PER_BOOKING: 3,
  DISCOUNT_CODES: 10,
  FLOORS: 5,

  // Images per entity
  ROOM_TYPE_IMAGES: 5,
  ROOM_IMAGES: 3,
};

// =============================================
// RANDOM HOTEL IMAGES (Unsplash & Picsum)
// =============================================
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

// =============================================
// HELPER FUNCTIONS
// =============================================
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

// =============================================
// PREDEFINED DATA
// =============================================
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

const FREE_AMENITIES = [
  "WiFi miễn phí",
  "Điều hòa",
  "TV màn hình phẳng",
  "Minibar",
  "Két an toàn",
  "Máy sấy tóc",
  "Đồ vệ sinh cá nhân",
  "Dép đi trong phòng",
  "Áo choàng tắm",
  "Bàn làm việc",
  "Ấm đun nước",
  "Cà phê/Trà miễn phí",
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
  { name: "Giặt ủi quần áo", price: 50000 },
  { name: "Dịch vụ phòng 24/7", price: 0 },
  { name: "Spa & Massage", price: 500000 },
  { name: "Gym & Fitness", price: 100000 },
  { name: "Hồ bơi", price: 150000 },
  { name: "Đưa đón sân bay", price: 300000 },
  { name: "Thuê xe du lịch", price: 1000000 },
  { name: "Bữa sáng buffet", price: 200000 },
  { name: "Bữa trưa set menu", price: 250000 },
  { name: "Bữa tối gala", price: 500000 },
  { name: "Tour city", price: 400000 },
  { name: "Karaoke", price: 300000 },
  { name: "Mini golf", price: 200000 },
  { name: "Thuê phòng họp", price: 2000000 },
  { name: "Dịch vụ trông trẻ", price: 150000 },
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

// =============================================
// DATABASE CONNECTION
// =============================================
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// =============================================
// SEED FUNCTIONS
// =============================================

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
    "room_images",
    "room_type_images",
    "rooms",
    "room_types",
    "refund_policies",
    "services",
    "master_equipments",
    "users",
  ];

  for (const table of tables) {
    await pool.query(`DELETE FROM ${table}`);
    // Reset sequence
    await pool.query(`ALTER SEQUENCE IF EXISTS ${table}_id_seq RESTART WITH 1`);
  }

  console.log("✅ Data cleared!");
}

async function seedUsers() {
  console.log("👥 Seeding users...");

  const users = [];
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Admin user
  users.push({
    full_name: "Admin PenStar",
    email: "admin@penstar.com",
    password: hashedPassword,
    phone: "0901234567",
    role_id: 1, // admin
    status: "active",
  });

  // Manager
  users.push({
    full_name: "Quản lý Khách sạn",
    email: "manager@penstar.com",
    password: hashedPassword,
    phone: "0901234568",
    role_id: 2, // manager
    status: "active",
  });

  // Receptionists
  for (let i = 0; i < 3; i++) {
    users.push({
      full_name: faker.person.fullName(),
      email: `receptionist${i + 1}@penstar.com`,
      password: hashedPassword,
      phone: `09${faker.string.numeric(8)}`,
      role_id: 3, // receptionist
      status: "active",
    });
  }

  // Regular users
  for (let i = 0; i < CONFIG.USERS - 5; i++) {
    users.push({
      full_name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: hashedPassword,
      phone: `09${faker.string.numeric(8)}`,
      role_id: 4, // user
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

async function seedServices() {
  console.log("🛎️  Seeding services...");

  for (const service of SERVICE_NAMES) {
    await pool.query(
      `INSERT INTO services (name, price, description, is_included, image_url, thumbnail)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        service.name,
        service.price,
        faker.lorem.sentence(),
        service.price === 0,
        getRandomImage("services"),
        getRandomImage("services"),
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
        getRandomImage("rooms"),
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

    // Add room type images
    const images = getRandomImages("rooms", CONFIG.ROOM_TYPE_IMAGES);
    for (let j = 0; j < images.length; j++) {
      await pool.query(
        `INSERT INTO room_type_images (room_type_id, image_url, is_thumbnail)
         VALUES ($1, $2, $3)`,
        [result.rows[0].id, images[j], j === 0]
      );
    }

    // Add refund policy
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

  // Get floor IDs
  const floorsResult = await pool.query("SELECT id FROM floors ORDER BY id");
  const floorIds = floorsResult.rows.map((f) => f.id);

  let roomNumber = 101;

  for (const typeId of roomTypeIds) {
    for (let i = 0; i < CONFIG.ROOMS_PER_TYPE; i++) {
      const floorIndex = Math.floor((roomNumber - 101) / 10) % floorIds.length;
      const floorId = floorIds[floorIndex] || floorIds[0];

      const result = await pool.query(
        `INSERT INTO rooms (name, type_id, status, thumbnail, floor_id, short_desc, long_desc)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
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
          getRandomImage("rooms"),
          floorId,
          faker.lorem.sentence(),
          faker.lorem.paragraph(),
        ]
      );

      roomIds.push(result.rows[0].id);

      // Add room images
      const images = getRandomImages("rooms", CONFIG.ROOM_IMAGES);
      for (let j = 0; j < images.length; j++) {
        await pool.query(
          `INSERT INTO room_images (room_id, image_url, is_thumbnail)
           VALUES ($1, $2, $3)`,
          [result.rows[0].id, images[j], j === 0]
        );
      }

      roomNumber++;
    }
  }

  console.log(`✅ Created ${roomIds.length} rooms`);
  return roomIds;
}

async function seedDiscountCodes() {
  console.log("🎫 Seeding discount codes...");

  const types = ["percent", "fixed"];

  for (let i = 0; i < CONFIG.DISCOUNT_CODES; i++) {
    const type = getRandomElement(types);
    const value =
      type === "percent"
        ? getRandomNumber(5, 30)
        : getRandomNumber(50000, 500000);

    await pool.query(
      `INSERT INTO discount_codes (code, type, value, min_total, max_uses, max_uses_per_user, start_date, end_date, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        faker.string.alphanumeric(8).toUpperCase(),
        type,
        value,
        type === "percent" ? 500000 : 1000000,
        getRandomNumber(10, 100),
        getRandomNumber(1, 3),
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

  // Get user IDs and stay status IDs
  const usersResult = await pool.query(
    "SELECT id FROM users WHERE role_id = 4"
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

    // Add booking item
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

    // Add booking services
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

// =============================================
// MAIN EXECUTION
// =============================================
async function main() {
  console.log("🚀 Starting data seeding...\n");
  console.log("Configuration:");
  console.log(JSON.stringify(CONFIG, null, 2));
  console.log("\n");

  try {
    await clearData();
    await seedUsers();
    await seedMasterEquipments();
    await seedServices();
    const roomTypeIds = await seedRoomTypes();
    const roomIds = await seedRooms(roomTypeIds);
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
