export const createErrorResponse = (code, message, details) => ({
  success: false,
  error: {
    code,
    message,
    ...(details ? { details } : {}),
  },
});

export const createSuccessResponse = (data, message = "Success") => ({
  success: true,
  message,
  data,
});
