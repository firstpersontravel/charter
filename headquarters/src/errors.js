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

function authenticationError(message, data) {
  return apiError(401, 'AuthenticationError', message, data);
}

function forbiddenError(message, data) {
  return apiError(403, 'ForbiddenError', message, data);
}

function notFoundError(message, data) {
  return apiError(404, 'NotFoundError', message, data);
}

function internalError(message, data) {
  return apiError(500, 'InternalError', message, data);
}

module.exports = {
  badRequestError,
  forbiddenError,
  internalError,
  notFoundError,
  authenticationError,
  validationError
};
