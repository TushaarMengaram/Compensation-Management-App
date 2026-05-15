export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function sendError(res, status, message, details) {
  const body = { message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}
