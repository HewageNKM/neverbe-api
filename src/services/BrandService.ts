import { brandRepository } from "@/repositories/BrandRepository";
import { Brand } from "@/model/Brand";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";
import { uploadCompressedImage } from "./StorageService";
import { formatEntityDates, formatListDates } from "./UtilService";

/**
 * BrandService - Business logic for product brands
 * Delegates data access to brandRepository
 */

// 🔹 Create
export const createBrand = async (brand: Partial<Brand>, logo?: File) => {
  const id = `br-${nanoid(8)}`;
  let logoUrl = "";

  if (logo) {
    logoUrl = await uploadCompressedImage(
      logo,
      `brands/${id}/logo_${Date.now()}.webp`,
    );
  }

  const savedBrand = await brandRepository.create(id, {
    ...brand,
    name: brand.name!,
    description: brand.description || "",
    status: brand.status ?? true,
    logoUrl,
  } as Brand);

  return formatEntityDates(savedBrand);
};

export const getBrands = async (options: {
  page?: number;
  size?: number;
  search?: string;
  status?: "active" | "inactive" | null;
}) => {
  const { dataList, total } = await brandRepository.findPaginated(options);
  return {
    dataList: formatListDates(dataList),
    rowCount: total,
  };
};

// 🔹 Read single
export const getBrandById = async (id: string) => {
  const brand = await brandRepository.findById(id);
  if (!brand) throw new AppError("Brand not found", 404);
  return { success: true, data: formatEntityDates(brand) };
};

// 🔹 Update
export const updateBrand = async (
  id: string,
  updates: Partial<Brand>,
  logo?: File,
) => {
  const oldBrand = await brandRepository.findById(id);
  if (!oldBrand) throw new AppError("Brand not found", 404);

  let logoUrl = oldBrand.logoUrl || "";

  if (logo) {
    logoUrl = await uploadCompressedImage(
      logo,
      `brands/${id}/logo_${Date.now()}.webp`,
    );
  }

  return await brandRepository.update(id, {
    ...updates,
    logoUrl,
  });
};

// 🔹 Soft delete
export const deleteBrand = async (id: string) => {
  const exists = await brandRepository.findById(id);
  if (!exists) throw new AppError("Brand not found", 404);

  await brandRepository.softDelete(id);
  return { success: true };
};

export const getBrandDropdown = async () => {
  return await brandRepository.findForDropdown();
};
