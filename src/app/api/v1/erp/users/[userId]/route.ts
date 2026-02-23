import { NextResponse } from "next/server";
import { authorizeRequest, updateUser } from "@/services/AuthService";
import { User } from "@/model/User";
import { adminAuth, adminFirestore } from "@/firebase/firebaseAdmin";
import { errorResponse } from "@/utils/apiResponse";

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  try {
    const isAuthorized = await authorizeRequest(req, "manage_users");
    if (!isAuthorized) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = await params;
    const body: Partial<User> = await req.json();

    if (!userId) {
      return errorResponse("User ID is required", 400);
    }

    await updateUser(userId, body);

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return errorResponse(error);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  try {
    const isAuthorized = await authorizeRequest(req, "manage_users");
    if (!isAuthorized) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = await params;

    if (!userId) {
      return errorResponse("User ID is required", 400);
    }

    // Delete from Auth
    try {
      await adminAuth.deleteUser(userId);
    } catch (e: any) {
      if (e.code !== "auth/user-not-found") {
        // If user not found in auth, we proceed to delete from firestore
        throw e;
      }
    }

    // Delete from Firestore
    await adminFirestore.collection("users").doc(userId).delete();

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return errorResponse(error);
  }
};
