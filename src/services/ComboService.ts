import { adminStorageBucket } from "@/firebase/firebaseAdmin";
import { comboRepository } from "@/repositories/ComboRepository";
import { ComboProduct } from "@/model/ComboProduct";
import { nanoid } from "nanoid";
import { formatEntityDates, formatListDates } from "./UtilService";
import { AppError } from "@/utils/apiResponse";
import { uploadCompressedImage } from "./StorageService";

/**
 * ComboService - Business logic for combo/bundle products
 * Delegates data access to comboRepository
 */

const BUCKET = adminStorageBucket;

const uploadThumbnail = async (
  file: File,
  id: string,
): Promise<ComboProduct["thumbnail"]> => {
  const filePath = `combos/${id}/thumbnail/thumb_${Date.now()}.webp`;
  const url = await uploadCompressedImage(file, filePath);

  return { url, file: filePath, order: 0 };
};

export const getCombos = async (
  pageNumber: number = 1,
  size: number = 20,
): Promise<{ dataList: ComboProduct[]; rowCount: number }> => {
  const { dataList, rowCount } = await comboRepository.findPaginatedForErp({
    page: pageNumber,
    size
  });

  return { dataList: formatListDates(dataList), rowCount };
};

export const createCombo = async (
  data: Omit<ComboProduct, "id" | "updatedAt" | "createdAt" | "thumbnail">,
  file?: File,
): Promise<ComboProduct> => {
  const docId = `combo-${nanoid(10)}`;
  let thumbnail;
  if (file) thumbnail = await uploadThumbnail(file, docId);

  const newCombo = {
    ...data,
    startDate: data.startDate ? new Date(data.startDate as any) : null,
    endDate: data.endDate ? new Date(data.endDate as any) : null,
    thumbnail: thumbnail || null,
  };

  return await comboRepository.create(docId, newCombo);
};

export const updateCombo = async (
  id: string,
  data: Partial<ComboProduct>,
  file?: File,
): Promise<ComboProduct> => {
  const exists = await comboRepository.findById(id);
  if (!exists) throw new AppError(`Combo with ID ${id} not found`, 404);

  let newThumbnail: ComboProduct["thumbnail"] | undefined;
  if (file) {
    const oldPath = (exists as any).thumbnail?.file;
    if (oldPath) {
      try {
        await BUCKET.file(oldPath).delete();
      } catch (e) {
        console.warn(`Failed to delete old thumbnail: ${oldPath}`, e);
      }
    }
    newThumbnail = await uploadThumbnail(file, id);
  }

  const { createdAt, thumbnail: existingThumbnail, ...updateData } = data;
  const payload = {
    ...updateData,
    ...(newThumbnail ? { thumbnail: newThumbnail } : {}),
  };

  await comboRepository.update(id, payload);
  return (await comboRepository.findById(id)) as ComboProduct;
};

export const deleteCombo = async (id: string): Promise<{ id: string }> => {
  const exists = await comboRepository.findById(id);
  if (!exists) throw new AppError(`Combo with ID ${id} not found`, 404);
  await comboRepository.softDelete(id);
  return { id };
};

export const getComboById = async (id: string): Promise<ComboProduct> => {
  const data = await comboRepository.findById(id);
  if (!data) throw new AppError("Combo not found", 404);

  return formatEntityDates({
    ...data,
    id,
  });
};
