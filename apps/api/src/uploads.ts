/** Multer may decode multipart UTF-8 bytes as latin1; preserve native Unicode. */
export function uploadFilename(original:string):string {
  if([...original].some(character=>character.codePointAt(0)!>255))return original;
  const decoded=Buffer.from(original,'latin1').toString('utf8');
  return decoded.includes('\uFFFD')?original:decoded;
}
