import { adminFirestore } from "@/firebase/firebaseAdmin";
import { PettyCash } from "@/model/PettyCash";
import { nanoid } from "nanoid";
import { Timestamp } from "firebase-admin/firestore";
import { uploadFile } from "@/services/StorageService";
import { AppError } from "@/utils/apiResponse";
import { updateBankAccountBalance } from "./BankAccountService"; // Moved import to top

const COLLECTION_NAME = "expenses";

/**
 * Add new petty cash entry
 */
export const addPettyCash = async (
  data: Omit<
    PettyCash,
    "id" | "createdAt" | "updatedAt" | "reviewedBy" | "reviewedAt"
  >,
  file?: File
): Promise<PettyCash> => {
  const id = `pc-${nanoid(8)}`;
  let attachmentUrl = "";

  if (file) {
    const uploadResult = await uploadFile(file, `petty-cash/${id}`);
    attachmentUrl = uploadResult.url;
  }

  const newEntry = {
    ...data,
    id,
    attachment: attachmentUrl,
    status: "PENDING",
    isDeleted: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await adminFirestore.collection(COLLECTION_NAME).doc(id).set(newEntry);

  return {
    ...newEntry,
    createdAt: newEntry.createdAt.toDate().toISOString(),
    updatedAt: newEntry.updatedAt.toDate().toISOString(),
  } as unknown as PettyCash;
};

export const updatePettyCash = async (
  id: string,
  data: Partial<PettyCash>,
  file?: File
): Promise<PettyCash> => {
  const docRef = adminFirestore.collection(COLLECTION_NAME).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError(`Petty Cash entry with ID ${id} not found`, 404);
  }

  const currentData = doc.data() as PettyCash;
  if (currentData.status === "APPROVED") {
    throw new AppError("Cannot edit an approved entry.", 400);
  }

  let attachmentUrl = currentData.attachment;

  if (file) {
    const uploadResult = await uploadFile(file, `petty-cash/${id}`);
    attachmentUrl = uploadResult.url;
  }

  delete data.isDeleted;

  const updates = {
    ...data,
    attachment: attachmentUrl,
    updatedAt: Timestamp.now(),
  };

  await docRef.update(updates);

  // Return complete updated object
  const updatedDoc = await docRef.get();
  return updatedDoc.data() as PettyCash;
};

export const getPettyCashList = async (): Promise<PettyCash[]> => {
  const snapshot = await adminFirestore
    .collection(COLLECTION_NAME)
    .where("isDeleted", "==", false)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      ...d,
      createdAt:
        d.createdAt instanceof Timestamp
          ? d.createdAt.toDate().toISOString()
          : d.createdAt,
      updatedAt:
        d.updatedAt instanceof Timestamp
          ? d.updatedAt.toDate().toISOString()
          : d.updatedAt,
      reviewedAt:
        d.reviewedAt instanceof Timestamp
          ? d.reviewedAt.toDate().toISOString()
          : d.reviewedAt,
    } as PettyCash;
  });
};

export const getPettyCashById = async (id: string): Promise<PettyCash> => {
  const doc = await adminFirestore.collection(COLLECTION_NAME).doc(id).get();
  if (!doc.exists) {
    throw new AppError(`Petty Cash entry with ID ${id} not found`, 404);
  }
  const d = doc.data() as PettyCash;

  return {
    ...d,
    createdAt:
      d.createdAt instanceof Timestamp
        ? d.createdAt.toDate().toISOString()
        : d.createdAt,
    updatedAt:
      d.updatedAt instanceof Timestamp
        ? d.updatedAt.toDate().toISOString()
        : d.updatedAt,
    reviewedAt:
      d.reviewedAt instanceof Timestamp
        ? d.reviewedAt.toDate().toISOString()
        : d.reviewedAt,
  } as PettyCash;
};

export const deletePettyCash = async (id: string): Promise<void> => {
  const docRef = adminFirestore.collection(COLLECTION_NAME).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError(`Petty Cash entry with ID ${id} not found`, 404);
  }

  const data = doc.data() as PettyCash;
  if (data.status === "APPROVED") {
    throw new AppError("Cannot delete an approved entry.", 400);
  }

  await docRef.update({
    isDeleted: true,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Review petty cash entry (Approve/Reject)
 * Updates bank balance if approved and bank account is linked
 */
export const reviewPettyCash = async (
  id: string,
  status: "APPROVED" | "REJECTED",
  reviewerId: string
): Promise<PettyCash> => {
  const docRef = adminFirestore.collection(COLLECTION_NAME).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError(`Petty Cash entry with ID ${id} not found`, 404);
  }

  const currentData = doc.data() as PettyCash;
  if (currentData.status !== "PENDING") {
    throw new AppError(`Entry is already ${currentData.status}`, 400);
  }

  // If approving and bank account is linked, update balance
  if (status === "APPROVED" && currentData.bankAccountId) {
    // For expense: subtract from bank
    // For income: add to bank
    const balanceType = currentData.type === "expense" ? "subtract" : "add";

    await updateBankAccountBalance(
      currentData.bankAccountId,
      currentData.amount,
      balanceType
    );
  }

  const updates = {
    status,
    reviewedBy: reviewerId,
    reviewedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await docRef.update(updates);

  const updatedDoc = await docRef.get();
  const d = updatedDoc.data();

  return {
    ...d,
    createdAt:
      d?.createdAt instanceof Timestamp
        ? d.createdAt.toDate().toISOString()
        : d?.createdAt,
    updatedAt:
      d?.updatedAt instanceof Timestamp
        ? d.updatedAt.toDate().toISOString()
        : d?.updatedAt,
    reviewedAt:
      d?.reviewedAt instanceof Timestamp
        ? d.reviewedAt.toDate().toISOString()
        : d?.reviewedAt,
  } as PettyCash;
};
