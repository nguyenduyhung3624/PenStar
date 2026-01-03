import { sendBookingConfirmationEmail } from "./mailer.js";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Send email with exponential backoff retry
 * @param {string} email - Recipient email
 * @param {number} bookingId - Booking ID
 * @param {number} retryCount - Current retry attempt
 */
export const sendEmailWithRetry = async (email, bookingId, retryCount = 0) => {
  try {
    await sendBookingConfirmationEmail(email, bookingId);
    console.log(`[EMAIL] ✅ Sent successfully to ${email}`);
    return { success: true };
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      console.warn(
        `[EMAIL] ⚠️ Retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`,
        email
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendEmailWithRetry(email, bookingId, retryCount + 1);
    } else {
      console.error(
        `[EMAIL] ❌ Failed after ${MAX_RETRIES} retries for ${email}`,
        err.message
      );
      return { success: false, error: err.message };
    }
  }
};
