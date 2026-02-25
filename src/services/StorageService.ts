import { adminStorageBucket } from "@/firebase/firebaseAdmin";
import sharp from "sharp";

export const uploadFile = async (file: File, path: string) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileRef = adminStorageBucket.file(path);

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  await fileRef.makePublic();
  // Construct public URL
  const url = `https://storage.googleapis.com/${adminStorageBucket.name}/${path}`;

  return { url };
};

export const uploadCompressedImage = async (file: File, path: string) => {
  const bytes = await file.arrayBuffer();
  const originalBuffer = Buffer.from(bytes as ArrayBuffer);

  let quality = 80;
  let compressedBuffer: Buffer;
  const TARGET_SIZE_BYTES = 200 * 1024; // 200KB

  // Initial processing: Resize to max 1600px width/height and convert to webp
  const sharpInstance = sharp(originalBuffer).resize({
    width: 1600,
    height: 1600,
    fit: "inside",
    withoutEnlargement: true,
  });

  // Iterative compression loop
  do {
    compressedBuffer = await sharpInstance
      .webp({ quality, effort: 6 })
      .toBuffer();

    if (compressedBuffer.length <= TARGET_SIZE_BYTES || quality <= 10) {
      break;
    }

    quality -= 10;
  } while (quality > 0);

  const fileRef = adminStorageBucket.file(path);

  await fileRef.save(compressedBuffer, {
    metadata: {
      contentType: "image/webp",
    },
  });

  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${adminStorageBucket.name}/${path}`;

  return url;
};
