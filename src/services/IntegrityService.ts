import { hashRepository } from "@/repositories/HashRepository";
import crypto from "crypto";
import stringify from "json-stable-stringify";

/**
 * IntegrityService - Business logic for document integrity
 * Delegates data access to hashRepository
 */

export const generateDocumentHash = (docData: any) => {
  const dataToHash = { ...docData };
  // Remove fields that shouldn't be part of the hash
  delete dataToHash.integrity;
  delete dataToHash.updatedAt;
  
  const canonicalString = stringify(dataToHash);
  const hashingString = `${canonicalString}${process.env.HASH_SECRET}`;
  const hash = crypto.createHash("sha256").update(hashingString).digest("hex");
  return hash;
};

export const validateDocumentIntegrity = async (
  collectionName: string,
  docId: string,
  docData?: any
) => {
  try {
    const data = docData || await hashRepository.findAnyDocument(collectionName, docId);
    if (!data) {
      console.warn(`Document ${collectionName}/${docId} not found.`);
      return false;
    }

    const hashDoc = await hashRepository.findByDocId(docId);
    if (!hashDoc) {
      console.warn(`Hash ledger not found for ${collectionName}/${docId}.`);
      return false;
    }

    const storedHash = hashDoc.hashValue;
    const currentHash = generateDocumentHash(data);

    if (currentHash === storedHash) {
      return true;
    } else {
      console.warn(`🚨 TAMPERING DETECTED for ${collectionName}/${docId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error during validation for ${collectionName}/${docId}:`, error);
    return false;
  }
};

/**
 * Validate multiple documents at once (Batch Optimized)
 */
export const validateManyIntegrity = async (
  collectionName: string,
  documents: any[]
): Promise<Record<string, boolean>> => {
  if (!documents.length) return {};

  const docIds = documents.map(doc => doc.id || doc.orderId);
  const ledgerIds = docIds.map(id => `hash_${id}`);
  
  // Batch fetch hashes
  const hashDocs = await hashRepository.findByIds(ledgerIds);
  const hashMap = new Map(hashDocs.map(h => [h.sourceDocId, h.hashValue]));

  const results: Record<string, boolean> = {};

  documents.forEach(doc => {
    const id = doc.id || doc.orderId;
    const storedHash = hashMap.get(id);
    
    if (!storedHash) {
      results[id] = false;
      return;
    }

    const currentHash = generateDocumentHash(doc);
    results[id] = currentHash === storedHash;
  });

  return results;
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
