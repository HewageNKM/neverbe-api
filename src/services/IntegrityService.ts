import { hashRepository } from "@/repositories/HashRepository";
import crypto from "crypto";
import stringify from "json-stable-stringify";

/**
 * IntegrityService - Business logic for document integrity
 * Delegates data access to hashRepository
 */

export const generateDocumentHash = (docData: any) => {
  const dataToHash = { ...docData };
  const canonicalString = stringify(dataToHash);
  const hashingString = `${canonicalString}${process.env.HASH_SECRET}`;
  const hash = crypto.createHash("sha256").update(hashingString).digest("hex");
  return hash;
};

export const validateDocumentIntegrity = async (
  collectionName: string,
  docId: string,
) => {
  try {
    const docData = await hashRepository.findAnyDocument(collectionName, docId);
    if (!docData) {
      console.warn(`Document ${collectionName}/${docId} not found.`);
      return false;
    }

    const hashDoc = await hashRepository.findByDocId(docId);
    if (!hashDoc) {
      console.warn(`Hash ledger not found for ${collectionName}/${docId}.`);
      return false;
    }

    const storedHash = hashDoc.hashValue;
    const currentHash = generateDocumentHash(docData);

    if (currentHash === storedHash) {
      console.log(`✅ Integrity check PASSED for ${collectionName}/${docId}.`);
      return true;
    } else {
      console.warn(`🚨 TAMPERING DETECTED for ${collectionName}/${docId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error during validation for ${collectionName}/${docId}:`, error);
    throw error;
  }
};

export const updateOrAddOrderHash = async (data: any) => {
  try {
    const hashValue = generateDocumentHash(data);
    await hashRepository.saveHash(data.orderId, hashValue, "orders");
    console.log(`Hash ledger updated/created for order: ${data.orderId}`);
  } catch (error) {
    console.error(`Failed to create hash:`, error);
    throw error;
  }
};
