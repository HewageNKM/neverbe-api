import { userRepository } from "@/repositories/UserRepository";
import { User } from "@/model/User";
import { adminAuth } from "@/firebase/firebaseAdmin";
import { toSafeLocaleString, formatListDates } from "./UtilService";

/**
 * User Service - handles business logic for users
 */
export const getUsers = async (params: {
  page: number;
  size: number;
  search?: string;
  role?: string;
  status?: string;
}) => {
  const { page, size, search, role, status } = params;
  const offset = (page - 1) * size;

  // 1. Fetch users from Firestore
  const firestoreUsers = await userRepository.findUsers({
    status,
    role,
    limit: size,
    offset,
  });

  // 2. Fetch pending users from Firebase Auth (users not yet in Firestore)
  const listUsersResult = await adminAuth.listUsers();
  const existingUserIds = firestoreUsers.map((u) => u.userId);

  const pendingUsersFromAuth = listUsersResult.users
    .filter((user) => !existingUserIds.includes(user.uid))
    .map((user) => ({
      userId: user.uid,
      role: "Pending",
      status: false,
      email: user.email || "",
      username: user.displayName || "",
      createdAt: user.metadata.creationTime?.toLocaleString() || "",
      updatedAt: user.metadata.lastSignInTime?.toLocaleString() || "",
    } as User));

  // 3. Combine and apply search filter
  let allUsers = formatListDates([...firestoreUsers, ...pendingUsersFromAuth]);

  if (search?.trim()) {
    const searchLower = search.toLowerCase();
    allUsers = allUsers.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
    );
  }

  // 4. Get total count
  const firestoreCount = await userRepository.countUsers();
  const totalCount = firestoreCount + pendingUsersFromAuth.length;

  return {
    users: allUsers,
    total: totalCount,
    page,
    size,
    hasMore: allUsers.length === size,
  };
};

export const deleteUser = async (userId: string) => {
  // Delete from Auth
  try {
    await adminAuth.deleteUser(userId);
  } catch (e: any) {
    if (e.code !== "auth/user-not-found") {
      throw e;
    }
  }

  // Delete from Firestore (using repository indirectly via direct call for now or update repository)
  await userRepository.delete(userId);
};
