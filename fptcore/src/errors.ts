import type { FieldError } from './types';

class ScriptValidationError extends Error {
  fieldErrors: FieldError[];

  constructor(message: string, fieldErrors: FieldError[]) {
    super(message);
    this.name = 'ScriptValidationError';
    this.fieldErrors = fieldErrors;
  }
}

const Errors = {
  ScriptValidationError
};

export default Errors;

