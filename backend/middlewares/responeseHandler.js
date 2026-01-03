export const responseHandler = (req, res, next) => {
  /**
   * Send success response
   * @param {*} data - Response data
   * @param {string} message - Optional success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  res.success = (data, message = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message: message || "Success",
      data,
    });
  };

  /**
   * Send error response
   * @param {string} message - Error message
   * @param {string|object} error - Detailed error (hidden in production)
   * @param {number} statusCode - HTTP status code (default: 400)
   */
  res.error = (message, error = null, statusCode = 400) => {
    const response = {
      success: false,
      message: message || "Error",
    };

    // Only include error details in development
    if (process.env.NODE_ENV !== "production" && error) {
      response.error = error;
    }

    return res.status(statusCode).json(response);
  };

  next();
};
