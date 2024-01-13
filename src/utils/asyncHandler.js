const asyncHandler = (reqHandler) => {
  return (req, res, next) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => {
      return next(err);
    });
  };
};

export { asyncHandler };
