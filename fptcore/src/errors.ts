class ScriptValidationError extends Error {
  fieldErrors: any[];

  constructor(message: string, fieldErrors: any[]) {
    super(message);
    this.name = 'ScriptValidationError';
    this.fieldErrors = fieldErrors;
  }
}

const Errors = {
  ScriptValidationError
};

module.exports = Errors;

export {};
