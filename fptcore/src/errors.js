const Errors = {};

/**
 * Superclass for Validation errors
 */
function ScriptValidationError(message, fieldErrors) {
  this.message = message;
  this.fieldErrors = fieldErrors;
  this.stack = Error().stack;
}

ScriptValidationError.prototype = Object.create(Error.prototype);
ScriptValidationError.prototype.name = 'ScriptValidationError';

Errors.ScriptValidationError = ScriptValidationError;

module.exports = Errors;
