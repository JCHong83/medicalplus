import * as SecureStore from "expo-secure-store";
import EncryptedStorage from "react-native-encrypted-storage";
import { randomUUID } from "expo-crypto";
import { compressToUTF16, decompressFromUTF16 } from "lz-string";

const ENCRYPTION_KEY_KEY = "encryption_key";

// Get or create a persistent encryption key (stored in SecureStore)
export async function getOrCreateEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);
  if (!key) {
    key = randomUUID();
    await SecureStore.setItemAsync(ENCRYPTION_KEY_KEY, key);
  }
  return key;
}

// Save data securely (with compression + encryption)
export async function secureSetItem(key: string, value: any) {
  try {
    const encryptionKey = await getOrCreateEncryptionKey();
    const stringified = JSON.stringify(value);
    const compressed = compressToUTF16(stringified);

    // combine data + key for encryption (EncryptedStorage already AES-encrypts)
    await EncryptedStorage.setItem(key, JSON.stringify({ compressed, encryptionKey }));
  } catch (error) {
    console.error("SecureStorage set error:", error);
  }
}

// Retrieve data securely (with decompression + decryption)
export async function secureGetItem<T = any>(key: string): Promise<T | null> {
  try {
    const data = await EncryptedStorage.getItem(key);
    if (!data) return null;

    const parsed = JSON.parse(data);
    const decompressed = decompressFromUTF16(parsed.compressed);
    return JSON.parse(decompressed);
  } catch (error) {
    console.error("SecureStorage get error:", error);
    return null;
  }
}

// Remove data securely
export async function secureRemoveItem(key: string) {
  try {
    await EncryptedStorage.removeItem(key);
  } catch (error) {
    console.error("SecureStorage remove error:", error);
  }
}