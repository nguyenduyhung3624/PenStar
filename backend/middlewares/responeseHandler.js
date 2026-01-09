export const responseHandler = (req, res, next) => {
  res.success = (data, message = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message: message || "Success",
      data,
    });
  };
  res.error = (message, error = null, statusCode = 400) => {
    const response = {
      success: false,
      message: message || "Error",
    };
    if (process.env.NODE_ENV !== "production" && error) {
      response.error = error;
    }
    return res.status(statusCode).json(response);
  };
  next();
};
