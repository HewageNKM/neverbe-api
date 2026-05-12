import { pettyCashRepository } from "@/repositories/FinanceRepositories";
import { PettyCash } from "@/model/PettyCash";
import { nanoid } from "nanoid";
import { Timestamp } from "firebase-admin/firestore";
import { uploadFile } from "@/services/StorageService";
import { AppError } from "@/utils/apiResponse";
import { updateBankAccountBalance } from "./BankAccountService";
import { toSafeLocaleString, formatEntityDates, formatListDates, parseToDayjs } from "./UtilService";

/**
 * PettyCashService - Business logic for petty cash entries
 * Delegates data access to pettyCashRepository
 */

export const addPettyCash = async (
  data: Omit<PettyCash, "id" | "createdAt" | "updatedAt" | "reviewedBy" | "reviewedAt">,
  file?: File,
): Promise<PettyCash> => {
  if (!data.date) throw new AppError("Date is required", 400);
  const id = `pc-${nanoid(8)}`;
  let attachmentUrl = "";

  if (file) {
    const uploadResult = await uploadFile(file, `petty-cash/${id}`);
    attachmentUrl = uploadResult.url;
  }

  const now = Timestamp.now();
  const newEntry = {
    ...data,
    id,
    date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(parseToDayjs(data.date)?.toDate() || new Date()),
    attachment: attachmentUrl,
    status: "PENDING",
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  await pettyCashRepository.create(id, newEntry as any);

  return formatEntityDates({
    ...newEntry,
  } as any, ["date", "createdAt", "updatedAt"]);
};

export const updatePettyCash = async (
  id: string,
  data: Partial<PettyCash>,
  file?: File,
): Promise<PettyCash> => {
  const currentData = await pettyCashRepository.findById(id);
  if (!currentData) throw new AppError(`Petty Cash entry with ID ${id} not found`, 404);
  if (currentData.status === "APPROVED") throw new AppError("Cannot edit an approved entry.", 400);

  let attachmentUrl = currentData.attachment;
  if (file) {
    const uploadResult = await uploadFile(file, `petty-cash/${id}`);
    attachmentUrl = uploadResult.url;
  }

  const updates: any = {
    ...data,
    attachment: attachmentUrl,
  };
  if (data.date) updates.date = data.date instanceof Timestamp ? data.date : Timestamp.fromDate(parseToDayjs(data.date)?.toDate() || new Date());

  await pettyCashRepository.update(id, updates);
  return await pettyCashRepository.findById(id) as PettyCash;
};

export const getPettyCashList = async (
  page: number = 1,
  size: number = 10,
  filters?: {
    status?: string;
    type?: string;
    category?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    stockId?: string;
  },
): Promise<{ data: PettyCash[]; total: number }> => {
  let results = await pettyCashRepository.findFiltered({
    status: filters?.status,
    type: filters?.type,
    category: filters?.category,
    stockId: filters?.stockId,
  });

  // Business Logic: Formatting and Search
  let filtered = formatListDates(results, ["date", "createdAt", "updatedAt", "reviewedAt"]) as any[];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(r => 
      r.note?.toLowerCase().includes(s) || 
      r.category?.toLowerCase().includes(s) || 
      r.id.toLowerCase().includes(s)
    );
  }

  if (filters?.fromDate) {
    const fd = parseToDayjs(filters.fromDate)?.valueOf() || 0;
    filtered = filtered.filter(r => (parseToDayjs(r.date)?.valueOf() || 0) >= fd);
  }
  if (filters?.toDate) {
    const td = parseToDayjs(filters.toDate)?.endOf("day").valueOf() || 0;
    filtered = filtered.filter(r => (parseToDayjs(r.date)?.valueOf() || 0) <= td);
  }

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * size, page * size);

  return { data: paginated, total };
};

export const getPettyCashById = async (id: string): Promise<PettyCash> => {
  const d = await pettyCashRepository.findById(id);
  if (!d) throw new AppError(`Petty Cash entry with ID ${id} not found`, 404);

  return formatEntityDates({
    ...d,
  } as any, ["date", "createdAt", "updatedAt", "reviewedAt"]);
};

export const deletePettyCash = async (id: string): Promise<void> => {
  const data = await pettyCashRepository.findById(id);
  if (!data) throw new AppError(`Petty Cash entry with ID ${id} not found`, 404);
  if (data.status === "APPROVED") throw new AppError("Cannot delete an approved entry.", 400);
  await pettyCashRepository.softDelete(id);
};

export const reviewPettyCash = async (
  id: string,
  status: "APPROVED" | "REJECTED",
  reviewerId: string,
): Promise<PettyCash> => {
  const currentData = await pettyCashRepository.findById(id);
  if (!currentData) throw new AppError(`Petty Cash entry with ID ${id} not found`, 404);
  if (currentData.status !== "PENDING") throw new AppError(`Entry is already ${currentData.status}`, 400);

  if (status === "APPROVED" && currentData.bankAccountId) {
    const balanceType = currentData.type === "expense" ? "subtract" : "add";
    await updateBankAccountBalance(currentData.bankAccountId, currentData.amount, balanceType);
  }

  await pettyCashRepository.update(id, {
    status,
    reviewedBy: reviewerId,
    reviewedAt: Timestamp.now(),
  });

  return await getPettyCashById(id);
};
