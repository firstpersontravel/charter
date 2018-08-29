var Errors = {};

/**
 * Superclass for Validation errors
 */
function ScriptValidationError(message) {
  this.message = message;
  this.stack = Error().stack;
}
ScriptValidationError.prototype = Object.create(Error.prototype);
ScriptValidationError.prototype.name = 'ScriptValidationError';

/**
 * Superclass for Runtime errors
 */
function ScriptRuntimeError(message) {
  this.message = message;
  this.stack = Error().stack;
}
ScriptRuntimeError.prototype = Object.create(Error.prototype);
ScriptRuntimeError.prototype.name = 'ScriptRuntimeError';

/**
 * Factory function to create validation error
 */
function validationError(name) {
  function newError(message) {
    this.message = message;
    this.stack = Error().stack;
  }
  newError.prototype = Object.create(ScriptValidationError.prototype);
  newError.prototype.name = name;
}

Errors.ValidationError = validationError('ValidationError');

/**
 * Factory function to create runtime error
 */
function runtimeError(name) {
  function newError(message) {
    this.message = message;
    this.stack = Error().stack;
  }
  newError.prototype = Object.create(ScriptRuntimeError.prototype);
  newError.prototype.name = name;
}

Errors.InvalidParamError = runtimeError('InvalidParamError');

module.exports = Errors;
