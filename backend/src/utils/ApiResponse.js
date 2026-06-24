export class ApiResponse {
  constructor(statusCode, data = null, message = "Operation successful", meta = {}) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}