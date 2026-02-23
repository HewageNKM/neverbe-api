import { adminAuth, adminFirestore } from "@/firebase/firebaseAdmin";
import { headers } from "next/headers";
import { User } from "@/model/User";
import { AppError, errorResponse } from "@/utils/apiResponse";

export const authorizeOrderRequest = async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token != "undefined" && token) {
      await adminAuth.verifyIdToken(token);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    throw new AppError("Authorization Failed", 401);
  }
};

export const verifyPosAuth = async (requiredPermission?: string) => {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized: Missing or invalid token", 401);
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    const role = decodedToken.role?.toLowerCase();

    if (!role) {
      throw new AppError("Unauthorized: Role not found in token", 401);
    }

    // Admin bypasses all permission checks
    if (role === "admin") {
      return decodedToken;
    }

    // If permission required, check against role permissions
    if (requiredPermission) {
      const roleDoc = await adminFirestore.collection("roles").doc(role).get();

      if (!roleDoc.exists) {
        throw new AppError("Unauthorized: Role not found", 401);
      }

      const roleData = roleDoc.data();
      if (!roleData?.permissions?.includes(requiredPermission)) {
        throw new AppError(
          `Unauthorized: Missing permission '${requiredPermission}'`,
          403
        );
      }
    }

    return decodedToken;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error("Token verification failed:", error);
    throw new AppError("Unauthorized: Invalid token or user", 401);
  }
};

export const handleAuthError = (error: any) => {
  const status = error instanceof AppError ? error.statusCode : 500;
  return errorResponse(error, status);
};

export const authorizeRequest = async (
  req: any,
  requiredPermission?: string
) => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token && token !== "undefined") {
      // Pass 'true' to checkRevoked to ensure disabled users are blocked
      const decodedIdToken = await adminAuth.verifyIdToken(token, true);

      // Check role from Custom Claims
      const role = decodedIdToken.role?.toLowerCase();

      if (!role) {
        console.warn("Authorization Failed! No role in token.");
        return false;
      }

      // Super Admin has all permissions
      if (role === "admin") {
        return true;
      }

      if (requiredPermission) {
        // Fetch Role from Firestore to check permissions
        const roleDoc = await adminFirestore
          .collection("roles")
          .doc(role)
          .get();
        if (!roleDoc.exists) {
          console.warn(`Role '${role}' not found in database.`);
          return false;
        }

        const roleData = roleDoc.data();
        if (
          roleData?.permissions &&
          roleData.permissions.includes(requiredPermission)
        ) {
          return true;
        } else {
          console.warn(
            `User with role '${role}' does not have permission '${requiredPermission}'`
          );
          return false;
        }
      } else {
        // If no specific permission required, we default to blocking non-admins
        // (Access limited to ADMIN or explicit permission grant)
        console.warn(
          `User role '${role}' is not authorized for generic access!`
        );
        return false;
      }
    } else {
      console.warn("Authorization Failed! No token.");
      return false;
    }
  } catch (e) {
    console.error("Authorization Error:", e);
    return false;
  }
};
// Duplicate catch block removed

export const authorizeAndGetUser = async (req: any): Promise<User | null> => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token && token !== "undefined") {
      const decodedIdToken = await adminAuth.verifyIdToken(token, true);
      const role = decodedIdToken.role?.toLowerCase();

      // 1. Quick check using Custom Claims
      if (!role) {
        console.warn(`User role '${role}' is not authorized!`);
        return null;
      }

      // 2. Get user details from Firebase Auth (no Firestore users collection)
      const authUser = await adminAuth.getUser(decodedIdToken.uid);

      // Check if user is disabled
      if (authUser.disabled) {
        console.warn("User is inactive!");
        return null;
      }

      // 3. Fetch permissions if not ADMIN
      let permissions: string[] = [];
      if (role === "admin") {
        // ADMIN gets all permissions implicitly
      } else if (role) {
        try {
          const roleDoc = await adminFirestore
            .collection("roles")
            .doc(role)
            .get();
          if (roleDoc.exists) {
            permissions = roleDoc.data()?.permissions || [];
          }
        } catch (e) {
          console.warn("Failed to fetch role permissions", e);
        }
      }

      // Build User object from Firebase Auth data
      const userData: User = {
        userId: authUser.uid,
        email: authUser.email || "",
        username: authUser.displayName || "",
        photoURL: authUser.photoURL || "",
        role: role,
        status: !authUser.disabled,
        permissions: permissions,
        createdAt: authUser.metadata.creationTime || "",
        updatedAt: authUser.metadata.lastSignInTime || "",
      };

      return userData;
    } else {
      console.warn("Authorization Failed! No token.");
      return null;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const loginUser = async (userId: string) => {
  try {
    console.log(`Logging in user with ID: ${userId}`);
    // Get user from Firebase Auth (no Firestore users collection)
    const authUser = await adminAuth.getUser(userId);

    if (authUser.disabled) {
      throw new AppError(`User with ID ${authUser.email} is not active`, 403);
    }

    // Get role from custom claims
    const customClaims = authUser.customClaims || {};
    const role = customClaims.role as string | "";
    console.log(role);

    // Fetch permissions if not ADMIN
    let permissions: string[] = [];
    try {
      const roleDoc = await adminFirestore
        .collection("roles")
        .doc(role?.toLowerCase())
        .get();
      if (roleDoc.exists) {
        permissions = roleDoc.data()?.permissions || [];
      }
    } catch (e) {
      console.warn("Failed to fetch role permissions", e);
    }

    // Build User object from Firebase Auth data
    const userData: User = {
      userId: authUser.uid,
      email: authUser.email || "",
      username: authUser.displayName || "",
      photoURL: authUser.photoURL || "",
      role: role || "",
      status: !authUser.disabled,
      permissions,
      createdAt: authUser.metadata.creationTime || "",
      updatedAt: authUser.metadata.lastSignInTime || "",
    };

    return userData;
  } catch (e) {
    console.error(e);
    if (e instanceof AppError) throw e;
    throw new AppError(e instanceof Error ? e.message : "Login failed", 500);
  }
};

// --- User Management (CRUD) ---

export const createUser = async (user: User): Promise<string> => {
  let userId = user.userId;

  // 1. Create in Firebase Auth (no Firestore users collection)
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
      // If user uses existing email, try to retrieve uid
      if (error.code === "auth/email-already-exists") {
        const existingUser = await adminAuth.getUserByEmail(user.email);
        userId = existingUser.uid;
      } else {
        throw error;
      }
    }
  }

  // 2. Set Custom Claims for Auth (role stored in claims, not Firestore)
  if (user.role) {
    await adminAuth.setCustomUserClaims(userId, { role: user.role });
  }

  return userId;
};

export const updateUser = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  // 1. Update Firebase Auth (no Firestore users collection)
  const updates: any = {};
  if (typeof data.status === "boolean") {
    updates.disabled = data.status === false;
  }
  if (data.email) {
    updates.email = data.email;
  }
  if (data.username) {
    updates.displayName = data.username;
  }
  if (data.password) {
    updates.password = data.password;
  }
  if (data.photoURL) {
    updates.photoURL = data.photoURL;
  }

  if (Object.keys(updates).length > 0) {
    await adminAuth.updateUser(userId, updates);
  }

  // 2. Update Custom Claims if role changed
  if (data.role) {
    await adminAuth.setCustomUserClaims(userId, { role: data.role });
  }
};
