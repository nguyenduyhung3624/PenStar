
import { test, expect } from '@playwright/test';

// Constants
const API_URL = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'nguyenduyhung3624@gmail.com';
const ADMIN_PASS = '123456';

test.describe('Maintenance Status Logic', () => {
  let roomId: number;
  let bookingId: number;
  let roomName: string;
  let deviceId: number;
  let deviceName: string;

  // Setup: Find a room with devices, Create Booking, Check In
  test.beforeAll(async ({ request }) => {
    // 1. Login to get token
    const loginRes = await request.post(`${API_URL}/users/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    if (!loginData.data) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    const token = loginData.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 1.5 Get User ID
    const meRes = await request.get(`${API_URL}/users/me`, { headers });
    const meData = await meRes.json();
    const userId = meData.user.id;
    console.log(`Logged in as User ID: ${userId}`);

    // 2. Find a room with devices
    const roomsRes = await request.get(`${API_URL}/rooms?status=available`, { headers });
    const roomsData = await roomsRes.json();
    console.log(`Rooms found: ${roomsData.data?.length || 0}`);
    const allRooms = roomsData.data || [];
    const rooms = allRooms.filter((r: any) => r.status === 'available');
    console.log(`Available rooms: ${rooms.length}`);

    let targetRoom = null;
    let targetDevice = null;

    for (const r of rooms) {
      // Get devices for this room
      const devRes = await request.get(`${API_URL}/room-devices?room_id=${r.id}`, { headers });
      const devData = await devRes.json();
      // console.log(`Room ${r.id} devices:`, devData);
      const devices = devData.data || [];
      if (devices.length > 0) {
        targetRoom = r;
        targetDevice = devices[0];
        break;
      }
    }

    if (!targetRoom) {
      throw new Error('No available room with devices found. Seed data might be missing devices.');
    }

    roomId = targetRoom.id;
    roomName = targetRoom.name;
    deviceId = targetDevice.id;
    deviceName = targetDevice.device_name;
    console.log(`Using Room: ${roomName} (${roomId}), Device: ${deviceName} (${deviceId})`);

    // 3. Create Booking
    const bookingRes = await request.post(`${API_URL}/bookings`, {
      headers,
      data: {
        customer_name: 'Test Maintenance',
        total_price: 500000,
        payment_status: 'pending',
        booking_method: 'direct',
        stay_status_id: 1, // Booked
        user_id: userId,
        items: [
          {
            room_id: roomId,
            room_type_id: targetRoom.type_id,
            check_in: new Date().toISOString(),
            check_out: new Date(Date.now() + 86400000).toISOString(),
            room_type_price: 500000,
            num_adults: 1,
            num_children: 0
          }
        ]
      }
    });
    const bookingData = await bookingRes.json();
    console.log('Booking Response:', JSON.stringify(bookingData, null, 2));
    if (!bookingData.data) {
        throw new Error(`Booking failed: ${bookingData.message}`);
    }
    bookingId = bookingData.data.id;
    console.log(`Created Booking: ${bookingId}`);

    // 4. Check In
    const checkInRes = await request.post(`${API_URL}/bookings/${bookingId}/confirm-checkin`, { headers });
    console.log('Check-in status:', checkInRes.status());
    if (!checkInRes.ok()) console.log(await checkInRes.text());
  });

  test('Checkout with Broken Equipment -> Maintenance -> Resolve -> Available', async ({ page }) => {
    // 1. Login UI
    await page.goto('/signin');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    await page.waitForLoadState('networkidle');

    // 2. Go to Booking Detail
    console.log(`Navigating to /admin/bookings/${bookingId}`);
    await page.goto(`/admin/bookings/${bookingId}`, { waitUntil: 'networkidle' });

    // Debug: Check if page loaded
    const headers = page.locator('h1, h2, h3, h4, .ant-descriptions-title');
    await expect(headers.first()).toBeVisible();

    // Debug: Check status
    const bodyText = await page.locator('body').innerText();
    console.log('Page Content Preview:', bodyText.substring(0, 500));

    // 3. Click Checkout
    const checkoutBtn = page.locator('button:has-text("Trả phòng (Checkout)")');
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();

    // 4. Report Incident Modal
    await expect(page.locator('text=Báo cáo thiết bị hỏng')).toBeVisible();

    // Select Room
    // Wait for animation
    await page.waitForTimeout(500);

    const roomSelect = page.locator('.ant-select-selector:has(.ant-select-selection-placeholder:has-text("Chọn phòng"))');
    await roomSelect.click();
    await page.locator(`.ant-select-item-option-content:has-text("${roomName}")`).first().click();

    // Select Device
    const deviceSelect = page.locator('.ant-select-selector:has(.ant-select-selection-placeholder:has-text("Chọn thiết bị"))');
    await deviceSelect.click();
    // Logic to pick the first device option
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content').first().click();

    // Select Status "Hỏng" (value=broken)
    const statusSelect = page.locator('.ant-select-selector:has(.ant-select-selection-placeholder:has-text("Trạng thái"))');
    await statusSelect.click();
    await page.locator('.ant-select-item-option-content[title="Hỏng"]').click();

    // Click "Ghi nhận & Tiếp tục"
    await page.click('button:has-text("Ghi nhận & Tiếp tục")');

    // 5. Final Confirm Modal
    await expect(page.locator('text=Xác nhận Trả phòng & Thanh toán')).toBeVisible();
    // Wait a bit for calculations if any
    await page.waitForTimeout(500);
    // Click Confirm button (might vary depending on amount paid)
    // Usually it's the primary button in footer
    await page.locator('.ant-modal-footer button.ant-btn-primary').click();

    // Wait for success message
    await expect(page.locator('text=Đã checkout')).toBeVisible({ timeout: 10000 });

    // 6. Verify Room Status is Maintenance
    await page.goto('/admin/rooms');
    // Search for the room to filter list
    await page.fill('input[placeholder*="Tìm theo tên"]', roomName);
    // Wait for table update
    await page.waitForTimeout(1000);
    // Locate the row for this room
    const roomRow = page.locator(`tr:has-text("${roomName}")`);
    // Check for "Bảo trì" badge
    await expect(roomRow).toContainText('Bảo trì');

    // 7. Resolve Incident
    await page.goto('/admin/broken-equipments');
    // Search for room name
    await page.fill('input[placeholder*="Tìm theo thiết bị"]', roomName);
    await page.waitForTimeout(1000);

    // Find the row with our device and room
    const incidentRow = page.locator('tr').filter({ hasText: roomName }).filter({ hasText: deviceName }).first();
    await expect(incidentRow).toBeVisible();

    // Check Status "Chưa sửa"
    await expect(incidentRow).toContainText('Chưa sửa');

    // Click "Sửa xong"
    await incidentRow.locator('button:has-text("Sửa xong")').click();

    // Popconfirm "Đồng ý"
    await page.click('button:has-text("Đồng ý")');

    // Wait for success
    await expect(page.locator('text=Đã xác nhận sửa xong')).toBeVisible();

    // Verify Status updates to "Đã sửa"
    await expect(incidentRow).toContainText('Đã sửa');

    // 8. Verify Room Logic (Auto Re-Open)
    await page.goto('/admin/rooms');
    await page.fill('input[placeholder*="Tìm theo tên"]', roomName);
    await page.waitForTimeout(1000);
    const roomRowAfter = page.locator(`tr:has-text("${roomName}")`);
    // Should NOT be Maintenance anymore. Should be Available (or whatever it was).
    // Since we filtered by status=available in setup, it should go back to available.
    await expect(roomRowAfter).toContainText('Còn trống');
  });
});
