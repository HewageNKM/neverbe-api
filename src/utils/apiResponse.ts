import { NextResponse } from "next/server";

type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
};

/**
 * Standardized Success Response
 * @param data - The payload to return
 * @param message - Optional success message
 * @param status - HTTP status code (default 200)
 */
export const successResponse = <T>(
  data: T,
  message: string = "Success",
  status: number = 200,
  headers?: HeadersInit
) => {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    } as ApiResponse<T>,
    { status, headers }
  );
};

/**
 * Standardized Error Response
 * @param error - The error object or message
 * @param status - HTTP status code (default 500)
 * @param headers - Optional headers
 */
export const errorResponse = (
  error: any,
  status: number = 500,
  headers?: HeadersInit
) => {
  console.error("API Error:", error);

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Internal Server Error";

  // Handle specific error types if needed (e.g., specific Firebase errors)
  let finalStatus = status;
  if (
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("auth/")
  ) {
    finalStatus = 401;
  } else if (message.toLowerCase().includes("not found")) {
    finalStatus = 404;
  }

  return NextResponse.json(
    {
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error : undefined,
    } as ApiResponse,
    { status: finalStatus, headers }
  );
};

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
