import CryptoJS from "crypto-js";

export const decryptMessage = (encryptedMessage: string) => {
  try {
      const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!;
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8) || "[Decryption Error]";
  } catch (error) {
      console.error("Failed to decrypt message:", error);
      return "[Decryption Error]";
  }
}