// Implements the DevKit interface using Electron's OS-backed secret storage.
export function credentialEncryption(storage,isReady,platform=process.platform){
  const available=()=>isReady()&&storage.isEncryptionAvailable()&&(platform!=='linux'||['gnome_libsecret','kwallet','kwallet5','kwallet6'].includes(storage.getSelectedStorageBackend()));
  function requireAvailable(){if(!available())throw new Error('Desbloqueie o cofre do sistema operacional. O Atlas não salva tokens sem proteção do SO.');}
  return {id:'atlas-electron-safe-storage-v1',isAvailable:available,
    encrypt(text){requireAvailable();return storage.encryptString(text);},
    decrypt(bytes){requireAvailable();return storage.decryptString(Buffer.from(bytes));}};
}
