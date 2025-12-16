const crypto = require('crypto');

// Get encryption key from environment or use default
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(32); // 32 bytes for AES-256

/**
 * Encrypt sensitive data (e.g., payment account details)
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in hex format
 */
function encrypt(text) {
  if (!text) return text;
  
  try {
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Encrypt
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data (IV is not secret, needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Encryption error:', error.message);
    return text;
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text in hex:hex format
 * @returns {string} - Decrypted text
 */
function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  
  try {
    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText; // Not encrypted in our format
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Create decipher
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error.message);
    return encryptedText;
  }
}

/**
 * Hash sensitive data (one-way, cannot decrypt)
 * @param {string} text - Text to hash
 * @returns {string} - SHA256 hash
 */
function hash(text) {
  if (!text) return text;
  
  try {
    return crypto.createHash('sha256').update(String(text)).digest('hex');
  } catch (error) {
    console.error('❌ Hash error:', error.message);
    return text;
  }
}

/**
 * Generate a secure random token
 * @param {number} length - Length of token (default 32)
 * @returns {string} - Random token in hex format
 */
function generateToken(length = 32) {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    console.error('❌ Token generation error:', error.message);
    return '';
  }
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateToken
};
