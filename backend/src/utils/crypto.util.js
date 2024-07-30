const crypto = require("crypto");

const getKeyFromPassword = (password, salt, keyLength = 32) => {
  return crypto.scryptSync(password, salt, keyLength);
};

const encrypt = (text, password) => {
  const salt = crypto.randomBytes(16);
  const key = getKeyFromPassword(password, salt);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    salt: salt.toString("hex"),
    encrypted: encrypted,
  };
};

const decrypt = (encryptedData, password) => {
  const key = getKeyFromPassword(
    password,
    Buffer.from(encryptedData.salt, "hex")
  );
  const iv = Buffer.from(encryptedData.iv, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

// Usage
// const password = 'your-password-here'; // Replace with your password
// const textToEncrypt = 'This is a long string that needs to be encrypted';
// const encryptedData = encrypt(textToEncrypt, password);
// console.log('Encrypted:', encryptedData);

// const decryptedData = decrypt(encryptedData, password);
// console.log('Decrypted:', decryptedData);

module.exports = {
  encrypt,
  decrypt,
};
