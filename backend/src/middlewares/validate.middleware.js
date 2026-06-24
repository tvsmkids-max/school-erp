import { ApiError } from "../utils/ApiError.js";

const formatZodErrors = (zodError) => {
  return zodError.errors.map((error) => ({
    field: error.path.join("."),
    message: error.message,
  }));
};

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(new ApiError(400, "Validation failed", formatZodErrors(result.error)));
    }

    req.validated = result.data;
    return next();
  };
};