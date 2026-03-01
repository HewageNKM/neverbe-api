import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.ENCRYPTION_KEY || "default-secret-key-change-me";

export const encryptData = (text: string, userId: string): string => {
  if (!text || !userId) return "";
  const uniqueKey = `${SECRET_KEY}-${userId}`;
  return CryptoJS.AES.encrypt(text, uniqueKey).toString();
};

export const decryptData = (ciphertext: string, userId: string): string => {
  if (!ciphertext || !userId) return "";
  try {
    const uniqueKey = `${SECRET_KEY}-${userId}`;
    const bytes = CryptoJS.AES.decrypt(ciphertext, uniqueKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
};
