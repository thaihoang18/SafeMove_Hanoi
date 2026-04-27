import crypto from "node:crypto";

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, "airpath-static-salt", 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey.toString("hex"));
    });
  });
}

