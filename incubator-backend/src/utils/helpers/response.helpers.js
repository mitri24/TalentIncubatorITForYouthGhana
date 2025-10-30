/**
 * The response utility functions
 * This file defines reusable functions for sending standardized API responses
 * It helps maintain consistency in response formats across the application 
 */
export const sendSuccessResponse = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const sendErrorResponse = (res, error, message = "Error", statusCode = 500) => {
  return res.status(statusCode).json({
    status: "error",
    message,
    error: error.message || error,
  });
};

export const paginationResponse = (res, data, page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  return res.status(200).json({
    status: "success",
    message: "Paginated data fetched successfully",
    data,
    has_next: page < totalPages,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  });
};