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
  let buffer = Buffer.from(bytes as ArrayBuffer);

  // Compress and convert to webp using sharp
  buffer = await sharp(buffer)
    .webp({ quality: 70, effort: 6 }) // High effort for better compression
    .toBuffer();

  const fileRef = adminStorageBucket.file(path);

  await fileRef.save(buffer, {
    metadata: {
      contentType: "image/webp",
    },
  });

  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${adminStorageBucket.name}/${path}`;

  return url;
};
