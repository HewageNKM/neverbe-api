import crypto from 'crypto';

export const generateId = (type: string, name: string) => {
    switch (type) {
        case 'item':
            return `${name.trim().substring(0, 3)}-${window.crypto.randomUUID().replace("-", "").substring(0, 5)}`.toLowerCase();
        case 'variant':
            return `VA-${window.crypto.randomUUID().replace("-", "").substring(0, 5)}`.toLowerCase();
        default:
            return ""
    }
}

export const generateRandomPassword = (length = 12) => {
    return crypto.randomBytes(length).toString("base64").slice(0, length);
}

export const hashPassword = (password: string): string => {
    const hash = crypto.createHash("sha256"); // Use a secure algorithm like SHA-256
    hash.update(password); // Add the password to the hash
    return hash.digest("hex"); // Return the hashed password as a hexadecimal string
};