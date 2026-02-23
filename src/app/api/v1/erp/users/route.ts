import { NextResponse } from "next/server";
import { adminFirestore } from "@/firebase/firebaseAdmin";
import { authorizeRequest, createUser } from "@/services/AuthService";
import { User } from "@/model/User";
import admin from "firebase-admin";
import { errorResponse } from "@/utils/apiResponse";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const isAuthorized = await authorizeRequest(req, "manage_users");
    if (!isAuthorized) {
      return errorResponse("Unauthorized", 401);
    }

    // Get the URL and parse the query parameters
    const url = new URL(req.url);
    const pageNumber = parseInt(url.searchParams.get("page") as string) || 1;
    const size = parseInt(url.searchParams.get("size") as string) || 20;
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "all";
    const status = url.searchParams.get("status") || "all";

    console.log(
      `V2 Users API - Page: ${pageNumber}, Size: ${size}, Search: ${search}, Role: ${role}, Status: ${status}`
    );

    const offset = (pageNumber - 1) * size;

    // Build query
    let query: FirebaseFirestore.Query = adminFirestore.collection("users");

    // Apply status filter if not "all"
    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    // Apply role filter if not "all"
    if (role !== "all") {
      query = query.where("role", "==", role.toUpperCase());
    }

    // Fetch users
    const usersSnapshot = await query.limit(size).offset(offset).get();

    const users: User[] = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toLocaleString() || "",
        updatedAt: data.updatedAt?.toDate?.()?.toLocaleString() || "",
      } as User);
    });

    // Also fetch pending users from Firebase Auth (users not yet in Firestore)
    const listUsersResult = await admin.auth().listUsers();
    const existingUserIds = users.map((u) => u.userId);

    const uniqueUsers = listUsersResult.users.filter(
      (user) => !existingUserIds.includes(user.uid)
    );

    // Add pending users
    uniqueUsers.forEach((user) => {
      users.push({
        userId: user.uid,
        role: "Pending",
        status: false,
        email: user.email || "",
        username: user.displayName || "",
        createdAt: user.metadata.creationTime?.toLocaleString() || "",
        updatedAt: user.metadata.lastSignInTime?.toLocaleString() || "",
      } as User);
    });

    // Apply search filter
    let filteredUsers = users;
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Get total count
    const totalSnapshot = await adminFirestore.collection("users").get();
    const totalCount = totalSnapshot.size + uniqueUsers.length;

    console.log(
      `V2 Users API - Fetched ${filteredUsers.length} users (total: ${totalCount})`
    );

    return NextResponse.json({
      users: filteredUsers,
      total: totalCount,
      page: pageNumber,
      size: size,
      hasMore: filteredUsers.length === size,
    });
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const POST = async (req: Request) => {
  try {
    // Verify the ID token
    const isAuthorized = await authorizeRequest(req, "manage_users");
    if (!isAuthorized) {
      return errorResponse("Unauthorized", 401);
    }

    const body: User = await req.json();
    if (!body) {
      return errorResponse("Invalid request body", 400);
    }

    const userId = await createUser(body);
    return NextResponse.json({ userId }, { status: 201 });
  } catch (error: any) {
    return errorResponse(error);
  }
};
