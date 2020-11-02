const Errors = {};

/**
 * Superclass for Validation errors
 */
function ScriptValidationError(message, fieldErrors) {
  this.message = message;
  this.fieldErrors = fieldErrors;
  try {
    this.stack = Error().stack;
  } catch (err) {
    this.stack = null;
  }
}

ScriptValidationError.prototype = Object.create(Error.prototype);
ScriptValidationError.prototype.name = 'ScriptValidationError';

Errors.ScriptValidationError = ScriptValidationError;

module.exports = Errors;
