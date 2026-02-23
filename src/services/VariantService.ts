import { adminFirestore, adminStorageBucket } from "@/firebase/firebaseAdmin";
import { Product } from "@/model/Product";
import { ProductVariant } from "@/model/ProductVariant";
import { Img } from "@/model/Img";
import { nanoid } from "nanoid";
import { FieldValue } from "firebase-admin/firestore";
import { AppError } from "@/utils/apiResponse";

const PRODUCTS_COLLECTION = "products";
const BUCKET = adminStorageBucket;

/**
 * Helper function to upload variant images to Firebase Storage.
 */
const uploadVariantImage = async (
  file: File,
  productId: string,
  variantId: string
): Promise<Img> => {
  const fileId = nanoid(8).toLowerCase();
  const fileName = `${fileId}-${file.name}`;
  const filePath = `products/${productId}/variants/${variantId}/${fileName}`;
  const fileRef = BUCKET.file(filePath);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fileRef.save(buffer, { metadata: { contentType: file.type } });
  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${BUCKET.name}/${filePath}`;

  return { url, file: filePath, order: 0 };
};

/**
 * Adds a new variant and updates product tags.
 */
export const addVariant = async (
  productId: string,
  variantData: Partial<ProductVariant>,
  newImageFiles: File[]
): Promise<ProductVariant> => {
  const productRef = adminFirestore
    .collection(PRODUCTS_COLLECTION)
    .doc(productId);
  try {
    // --- Step 1: Get current product data ---
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }
    const currentProductData = productSnap.data() as Product;

    // --- Step 2: Prepare and upload images ---
    const variantId = `var-${nanoid(8)}`.toLowerCase();
    const uploadPromises = newImageFiles.map((file) =>
      uploadVariantImage(file, productId, variantId)
    );
    const uploadedImages = await Promise.all(uploadPromises);
    const finalImages = [...(variantData.images || []), ...uploadedImages];
    finalImages.forEach((img, index) => (img.order = index));

    // --- Step 3: Create the new variant object ---
    const newVariant: ProductVariant = {
      variantId: variantId,
      variantName: variantData.variantName || "",
      sizes: variantData.sizes || [],
      status: variantData.status || false,
      images: finalImages,
      isDeleted: false, // Ensure isDeleted is false for new variants
    };

    // --- Step 4: Update product with the new variant ---
    await productRef.update({
      variants: FieldValue.arrayUnion(newVariant),
      updatedAt: FieldValue.serverTimestamp(), // Use server timestamp
    });

    // --- Step 5: Construct updated product data locally ---
    // (arrayUnion doesn't return the updated doc, so we construct it)
    const updatedProductData: Product = {
      ...currentProductData,
      variants: [...(currentProductData.variants || []), newVariant],
      // We don't have the new server timestamp here, but generateTags shouldn't need it
    };

    // --- Step 7: Update tags on the product ---
    await productRef.update({
      updatedAt: FieldValue.serverTimestamp(), // Update timestamp again
    });

    console.log(
      `Variant ${variantId} added and tags updated for product ${productId}`
    );
    return newVariant;
  } catch (error) {
    console.error("Error adding variant:", error);
    await productRef.update({ updatedAt: FieldValue.serverTimestamp() }); // Update timestamp even on error?
    throw error;
  }
};

/**
 * Updates an existing variant and updates product tags.
 */
export const updateVariant = async (
  productId: string,
  variantId: string,
  variantData: Partial<ProductVariant>,
  newImageFiles: File[]
): Promise<ProductVariant> => {
  const productRef = adminFirestore
    .collection(PRODUCTS_COLLECTION)
    .doc(productId);
  try {
    // --- Step 1: Get current product data ---
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }
    const currentProductData = productSnap.data() as Product;
    const existingVariants = currentProductData.variants || [];

    const variantIndex = existingVariants.findIndex(
      (v) => v.variantId === variantId
    );
    if (variantIndex === -1) {
      throw new AppError(
        `Variant with ID ${variantId} not found in product ${productId}`,
        404
      );
    }

    // --- Step 2: Prepare and upload new images ---
    const uploadPromises = newImageFiles.map((file) =>
      uploadVariantImage(file, productId, variantId)
    );
    const uploadedImages = await Promise.all(uploadPromises);
    // Use the potentially modified list of existing images from variantData
    const finalImages = [...(variantData.images || []), ...uploadedImages];
    finalImages.forEach((img, index) => (img.order = index));

    // --- Step 3: Create the fully updated variant object ---
    const updatedVariant: ProductVariant = {
      ...existingVariants[variantIndex], // Start with existing
      ...variantData, // Apply changes from form
      variantId: variantId, // Ensure ID isn't overwritten
      images: finalImages, // Set final image list
      isDeleted: false, // Ensure isDeleted is false on update
    };

    // --- Step 4: Construct the new variants array ---
    const newVariantsArray = existingVariants.map((v, index) =>
      index === variantIndex ? updatedVariant : v
    );

    // --- Step 5: Update product with the modified variants array ---
    await productRef.update({
      variants: newVariantsArray,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // --- Step 6: Construct updated product data locally ---
    const updatedProductData: Product = {
      ...currentProductData,
      variants: newVariantsArray,
    };

    // --- Step 8: Update tags ---
    await productRef.update({
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `Variant ${variantId} updated and tags updated for product ${productId}`
    );
    return updatedVariant;
  } catch (error) {
    console.error("Error updating variant:", error);
    await productRef.update({ updatedAt: FieldValue.serverTimestamp() });
    throw error;
  }
};

/**
 * Marks a variant as deleted and updates product tags.
 */
export const deleteVariant = async (
  productId: string,
  variantId: string
): Promise<boolean> => {
  const productRef = adminFirestore
    .collection(PRODUCTS_COLLECTION)
    .doc(productId);
  try {
    // --- Step 1: Get current product data ---
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }
    const currentProductData = productSnap.data() as Product;
    const existingVariants = currentProductData.variants || [];

    const variantIndex = existingVariants.findIndex(
      (v) => v.variantId === variantId
    );
    if (variantIndex === -1) {
      console.warn(
        `Variant ${variantId} not found for deletion in product ${productId}.`
      );
      return false;
    }

    // --- Step 2: Create the new variants array with the target marked ---
    const updatedVariantsArray = existingVariants.map((variant, index) => {
      if (index === variantIndex) {
        return { ...variant, isDeleted: true }; // Mark as deleted
      }
      return variant;
    });

    // --- Step 3: Update product with the modified variants array ---
    await productRef.update({
      variants: updatedVariantsArray,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // --- Step 4: Construct updated product data locally ---
    const updatedProductData: Product = {
      ...currentProductData,
      variants: updatedVariantsArray,
    };

    // --- Step 6: Update tags ---
    await productRef.update({
      updatedAt: FieldValue.serverTimestamp(),
    });

    // TODO: Optionally delete images from storage here or via a scheduled function later

    console.log(
      `Variant ${variantId} marked deleted and tags updated for product ${productId}`
    );
    return true;
  } catch (error) {
    console.error("Error deleting variant:", error);
    await productRef.update({ updatedAt: FieldValue.serverTimestamp() });
    throw error;
  }
};

export const getProductVariantsForDropdown = async (productId: string) => {
  try {
    const productRef = adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .doc(productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      console.warn(`Product with ID ${productId} not found.`);
      return [];
    }

    const productData = productSnap.data() as Product;
    const activeVariants = (productData.variants || []).filter(
      (variant) => variant.isDeleted !== true && variant.status === true
    );

    const variants = activeVariants.map((variant) => ({
      id: variant.variantId,
      label: variant.variantName,
      sizes: variant.sizes,
    }));
    return variants;
  } catch (error) {
    console.error("Get Product Variants For Dropdown Error:", error);
    return [];
  }
};
