import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "https://erp.neverbe.lk",
  "https://pos.neverbe.lk",
  "https://www.neverbe.lk",
  "http://localhost:3000",
];

export function proxy(request: NextRequest) {
  // Retrieve the origin from the request
  const origin = request.headers.get("origin");

  // Check if the origin is allowed, otherwise default to the first valid origin
  // (Or if no origin, like a direct server-to-server fetch, just use *)
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const corsOrigin = isAllowedOrigin ? origin : origin ? "" : "*";

  // Handle preflight requests (OPTIONS)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Continue normal requests but attach CORS headers
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", corsOrigin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

// Ensure the proxy runs on /api paths
export const config = {
  matcher: "/api/:path*",
};
