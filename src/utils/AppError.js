export class AppError extends Error {
  constructor(status = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
