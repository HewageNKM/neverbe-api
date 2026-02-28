import { adminAuth } from "@/firebase/firebaseAdmin";

// Function to verify Firebase ID token from request headers
export const verifyToken = async (req: any) => {
  try {
    console.log("[Auth] Verifying Firebase ID token");

    const authHeader = req.headers.get("authorization");
    console.log("[Auth] Authorization header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[Auth] Missing or invalid Authorization header");
      throw new Error("Authorization header is missing or invalid");
    }

    const idToken = authHeader.split(" ")[1];
    console.log("[Auth] ID token extracted");

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("[Auth] Token verified successfully:", decodedToken.uid);

    return decodedToken;
  } catch (e: any) {
    console.error("[Auth] Error verifying token:", e.message, e.stack);
    throw e;
  }
};
