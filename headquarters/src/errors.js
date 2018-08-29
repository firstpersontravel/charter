/**
 * Error classes
 */

function apiError(status, type, message, data=null) {
  const err = new Error();
  err.status = status;
  err.type = type;
  err.message = message;
  err.data = data;
  return err;
}

function validationError(message, data) {
  return apiError(422, 'ValidationError', message, data);
}

function badRequestError(message, data) {
  return apiError(400, 'BadRequestError', message, data);
}

function notFoundError(message, data) {
  return apiError(404, 'NotFoundError', message, data);
}

module.exports = {
  badRequestError,
  notFoundError,
  validationError
};
