import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  AppError,
} from "../utils/AppError";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

  if (
    error?.name ===
    "CastError"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }

  if (
    error?.code === 11000
  ) {
    return res.status(409).json({
      success: false,
      message:
        "A record with this value already exists",
    });
  }

  if (
    error instanceof AppError
  ) {
    return res
      .status(error.statusCode)
      .json({
        success: false,
        message: error.message,
      });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};