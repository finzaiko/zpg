function encryptData(secretData, password) {
    const enc = new TextEncoder();
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      return getPasswordKey(password).then((passwordKey) => {
        return deriveKey(passwordKey, salt, ["encrypt"]).then((aesKey) => {
          return window.crypto.subtle
            .encrypt(
              {
                name: "AES-GCM",
                iv: iv,
              },
              aesKey,
              enc.encode(secretData)
            )
            .then((encryptedContent) => {
              const encryptedContentArr = new Uint8Array(encryptedContent);
              let buff = new Uint8Array(
                salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
              );
              buff.set(salt, 0);
              buff.set(iv, salt.byteLength);
              buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);
              const base64Buff = buff_to_base64(buff);
              return base64Buff;
            });
        });
      });
    } catch (error) {
      console.log(`Error - ${error}`);
      return "";
    }
  }

  function decryptData(encryptedData, password) {
    const dec = new TextDecoder();
    try {
      const encryptedDataBuff = base64_to_buf(encryptedData);
      const salt = encryptedDataBuff.slice(0, 16);
      const iv = encryptedDataBuff.slice(16, 16 + 12);
      const data = encryptedDataBuff.slice(16 + 12);

      return getPasswordKey(password).then((passwordKey) => {
        return deriveKey(passwordKey, salt, ["decrypt"]).then((aesKey) => {
          return window.crypto.subtle
            .decrypt(
              {
                name: "AES-GCM",
                iv: iv,
              },
              aesKey,
              data
            )
            .then((decryptedContent) => {
              return dec.decode(decryptedContent);
            });
        });
      });
    } catch (error) {
      console.log(`Error - ${error}`);
      return "";
    }
  }

  function getPasswordKey(password) {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
  }

  function deriveKey(passwordKey, salt, keyUsage) {
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 250000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      keyUsage
    );
  }

  function buff_to_base64(buff) {
    return btoa(
      new Uint8Array(buff).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
  }

  function base64_to_buf(b64) {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));
  }

  //console.log(noSecretData)

  const secret = JSON.stringify(noSecretData)
  encryptData(secret, "123").then(a=>{
      console.log("a>> ",a)

      decryptData(a, "123").then(b=>{
         console.log("b>> ",b)
      })
  });


// Sample source: https://github.com/bradyjoslin/webcrypto-example/blob/master/script.js

