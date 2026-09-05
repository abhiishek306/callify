import { ZodError } from "zod";
import { createErrorResponse } from "../lib/http.js";

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return res.status(400).json(
        createErrorResponse(
          "VALIDATION_ERROR",
          "Request validation failed",
          parsed.error.issues.map((issue) => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
          }))
        )
      );
    }

    req.validatedBody = parsed.data;
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(
        createErrorResponse(
          "VALIDATION_ERROR",
          "Request validation failed",
          error.issues.map((issue) => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
          }))
        )
      );
    }

    return next(error);
  }
};
