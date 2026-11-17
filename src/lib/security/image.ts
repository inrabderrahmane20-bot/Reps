import sharp from 'sharp';
import {validateImage} from '../visual-editor/validation';
export async function sanitizeUpload(bytes:Buffer,mime:string,maximum=4*1024*1024){
 if(bytes.length>maximum)throw Object.assign(new Error('Image is too large.'),{status:413,expose:true});
 try{
  validateImage(bytes,mime);
  // Decode and re-encode: reject malformed/polyglot images, bound decompression and strip metadata.
  const image=sharp(bytes,{limitInputPixels:16_000_000,failOn:'warning',animated:false});
  const meta=await image.metadata();
  if(!meta.width||!meta.height||meta.width>8000||meta.height>8000)throw new Error('Invalid dimensions.');
  const data=await image.rotate().webp({quality:85}).toBuffer();
  if(data.length>maximum)throw new Error('Image is too large after processing.');
  return {data,mime:'image/webp',extension:'webp'};
 }catch{throw Object.assign(new Error('Upload a valid JPEG, PNG, GIF or WebP image (at most 16 megapixels).'),{status:400,expose:true});}
}
