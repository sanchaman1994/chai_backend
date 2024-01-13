const asyncHandler = (reqHandler) => {
  return (req, res, next) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => {
      return next(err);
    });
  };
};

/*
// This is an asynchronous handler function
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    // await the callback function
    await fn(req, res, next);
  } catch (err) {
    // if there is an error, set the status and respond with the error message
    res.status(err.code || 500).json({
      success: false,
      message: err.message,
    });
  }
};

// export the asyncHandler function
*/
export { asyncHandler };
