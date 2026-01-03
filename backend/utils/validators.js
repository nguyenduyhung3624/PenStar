export const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return str.trim().replace(/<[^>]*>/g, "");
};

/**
 * Sanitize all string fields in object
 */
export const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Vietnamese phone number
 */
export const isValidPhoneVN = (phone) => {
  const phoneRegex = /^(\+84|0)\d{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};
