// Simple encryption/decryption for sensitive data
const ENCRYPTION_KEY = 'reurb-2024-secure-key';

export function encryptData(data: string): string {
  try {
    // Simple XOR encryption for client-side storage
    const encrypted = Array.from(data).map(char => 
      char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(0)
    );
    return btoa(String.fromCharCode(...encrypted));
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Fallback to unencrypted
  }
}

export function decryptData(encryptedData: string): string {
  try {
    // Check if data looks like base64 (encrypted)
    // Base64 strings typically contain only A-Z, a-z, 0-9, +, /, =
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(encryptedData) && encryptedData.length % 4 === 0;
    
    if (!isBase64) {
      // Data is not encrypted, return as is
      return encryptedData;
    }
    
    const decoded = atob(encryptedData);
    const decrypted = Array.from(decoded).map(char => 
      char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(0)
    );
    return String.fromCharCode(...decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Fallback to original
  }
}

export function encryptApiKey(apiKey: string): string {
  if (!apiKey || apiKey === '') return apiKey;
  return encryptData(apiKey);
}

export function decryptApiKey(encryptedApiKey: string): string {
  if (!encryptedApiKey || encryptedApiKey === '') return encryptedApiKey;
  return decryptData(encryptedApiKey);
}
