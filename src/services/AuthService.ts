import { adminAuth } from "@/firebase/firebaseAdmin";
import { headers } from "next/headers";
import { User } from "@/model/User";
import { AppError, errorResponse } from "@/utils/apiResponse";
import { roleRepository } from "@/repositories/RoleRepository";
import { toSafeLocaleString } from "./UtilService";


/**
 * Unified Auth Guard
 * Verifies token, role, and optional permissions.
 * Throws AppError on failure for global handling.
 */
export const requirePermission = async (req: Request | null, permission?: string) => {
  let authHeader: string | null = null;

  if (req) {
    authHeader = req.headers.get("authorization");
  } else {
    const headersList = await headers();
    authHeader = headersList.get("authorization");
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized: Missing or invalid token", 401);
  }

  const token = authHeader.includes("Bearer ") ? authHeader.split("Bearer ")[1] : authHeader.split(" ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    const role = decodedToken.role?.toLowerCase();

    if (!role) {
      throw new AppError("Unauthorized: Access denied (no role)", 403);
    }

    if (role === "admin") return decodedToken;

    if (permission) {
      const roleData = await roleRepository.findById(role);
      const permissions = roleData?.permissions || [];
      if (!roleData || !permissions.includes(permission)) {
        throw new AppError(`Forbidden: Missing permission '${permission}'`, 403);
      }
    }

    return decodedToken;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error("Auth Guard Error:", error);
    throw new AppError("Unauthorized: Invalid or expired session", 401);
  }
};

export const verifyPosAuth = (permission?: string) => requirePermission(null, permission);


export const handleAuthError = (error: any) => {
  const status = error instanceof AppError ? error.statusCode : 500;
  return errorResponse(error, status);
};


export const loginUser = async (userId: string) => {
  try {
    console.log(`[AuthService] Attempting login for user: ${userId}`);
    const authUser = await adminAuth.getUser(userId);

    const customClaims = authUser.customClaims || {};
    const role = customClaims.role as string | "";
    console.log(`[AuthService] Firebase user found: ${authUser.email}. Assigned Role: ${role || 'None'}`);

    if (authUser.disabled) {
      console.warn(`[AuthService] Login blocked: User ${authUser.email} is disabled.`);
      throw new AppError(`User with ID ${authUser.email} is not active`, 403);
    }

    let permissions: string[] = [];
    try {
      if (role) {
        const roleData = await roleRepository.findById(role.toLowerCase());
        permissions = roleData?.permissions || [];
        console.log(`[AuthService] Permissions fetched for role ${role}: ${permissions.length} items.`);
      }
    } catch (e) {
      console.warn(`[AuthService] Failed to fetch role permissions for ${role}:`, e);
    }

    const userData: User = {
      userId: authUser.uid,
      email: authUser.email || "",
      username: authUser.displayName || "",
      photoURL: authUser.photoURL || "",
      role: role || "",
      status: !authUser.disabled,
      permissions,
      createdAt: toSafeLocaleString(authUser.metadata.creationTime) || "",
      updatedAt: toSafeLocaleString(authUser.metadata.lastSignInTime) || "",
    };

    console.log(`[AuthService] Login logic completed successfully for ${userData.email}`);
    return userData;
  } catch (e: any) {
    console.error("[AuthService] Login CRITICAL Error for ID:", userId, e);
    if (e instanceof AppError) throw e;
    const message = e?.message || "Login failed";
    throw new AppError(message, 500);
  }
};

export const createUser = async (user: User): Promise<string> => {
  let userId = user.userId;

  if (!userId || user.password) {
    try {
      const authUser = await adminAuth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.username,
        photoURL: user.photoURL,
        disabled: user.status === false,
      });
      userId = authUser.uid;
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        const existingUser = await adminAuth.getUserByEmail(user.email);
        userId = existingUser.uid;
      } else {
        throw error;
      }
    }
  }

  if (user.role) {
    await adminAuth.setCustomUserClaims(userId, { role: user.role });
  }

  return userId;
};

export const updateUser = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  const updates: any = {};
  if (typeof data.status === "boolean") {
    updates.disabled = data.status === false;
  }
  if (data.email) updates.email = data.email;
  if (data.username) updates.displayName = data.username;
  if (data.password) updates.password = data.password;
  if (data.photoURL) updates.photoURL = data.photoURL;

  if (Object.keys(updates).length > 0) {
    await adminAuth.updateUser(userId, updates);
  }

  if (data.role) {
    await adminAuth.setCustomUserClaims(userId, { role: data.role });
  }
};
