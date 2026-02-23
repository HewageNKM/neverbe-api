import { adminFirestore, adminStorageBucket } from "@/firebase/firebaseAdmin";
import { Brand } from "@/model/Brand";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { AppError } from "@/utils/apiResponse";

const COLLECTION = "brands";

// 🔹 Upload logo to Firebase Storage
const uploadLogo = async (brandId: string, file: File) => {
  const bucket = adminStorageBucket;
  const path = `brands/${brandId}/logo_${Date.now()}.jpg`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileRef = bucket.file(path);

  await fileRef.save(buffer, {
    contentType: file.type,
    resumable: false,
    public: true,
  });

  return `https://storage.googleapis.com/${bucket.name}/${path}`;
};

// 🔹 Create
export const createBrand = async (brand: Partial<Brand>, logo?: File) => {
  const id = nanoid(8);
  let logoUrl = "";

  if (logo) {
    logoUrl = await uploadLogo(id, logo);
  }

  const data: Brand = {
    id,
    name: brand.name!,
    description: brand.description || "",
    status: brand.status ?? true,
    logoUrl,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await adminFirestore.collection(COLLECTION).doc(id).set(data);
  return { success: true, id };
};

export const getBrands = async ({
  page = 1,
  size = 10,
  search = "",
  status,
}: {
  page?: number;
  size?: number;
  search?: string;
  status?: "active" | "inactive" | null;
}) => {
  try {
    // 1️⃣ Base query
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false);

    // 2️⃣ Status filter
    if (status === "active") query = query.where("status", "==", true);
    if (status === "inactive") query = query.where("status", "==", false);

    // 3️⃣ Search filter (case-insensitive)
    if (search.trim()) {
      const s = search.trim();
      query = query.where("name", ">=", s).where("name", "<=", s + "\uf8ff");
    }

    // 4️⃣ Pagination
    const offset = (page - 1) * size;
    const snapshot = await query.offset(offset).limit(size).get();

    const dataList: Brand[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as Brand),
      id: doc.id,
    }));

    // 5️⃣ Total count for rowCount
    let totalQuery: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false);
    if (status === "active")
      totalQuery = totalQuery.where("status", "==", true);
    if (status === "inactive")
      totalQuery = totalQuery.where("status", "==", false);
    if (search.trim()) {
      const s = search.trim();
      totalQuery = totalQuery
        .where("name", ">=", s)
        .where("name", "<=", s + "\uf8ff");
    }
    const totalSnapshot = await totalQuery.get();

    return {
      dataList,
      rowCount: totalSnapshot.size,
    };
  } catch (error) {
    console.error("Get Brands Error:", error);
    return { dataList: [], rowCount: 0 };
  }
};

// 🔹 Read single
export const getBrandById = async (id: string) => {
  const doc = await adminFirestore.collection(COLLECTION).doc(id).get();
  if (!doc.exists || doc.data()?.isDeleted) {
    throw new AppError("Brand not found", 404);
  }
  return { success: true, data: doc.data() as Brand };
};

// 🔹 Update
export const updateBrand = async (
  id: string,
  updates: Partial<Brand>,
  logo?: File
) => {
  const ref = adminFirestore.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.isDeleted) {
    throw new AppError("Brand not found", 404);
  }

  let logoUrl = doc.data()?.logoUrl || "";

  if (logo) {
    logoUrl = await uploadLogo(id, logo);
  }

  const updatedData = {
    ...updates,
    logoUrl,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.update(updatedData);
  return { success: true };
};

// 🔹 Soft delete
export const deleteBrand = async (id: string) => {
  const ref = adminFirestore.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.isDeleted) {
    throw new AppError("Brand not found", 404);
  }

  await ref.update({
    isDeleted: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
};

export const getBrandDropdown = async () => {
  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .get();

    const brands = snapshot.docs.map((doc) => ({
      id: doc.id,
      label: doc.data().name,
    }));
    return brands;
  } catch (error) {
    console.log(error);
    return [];
  }
};
