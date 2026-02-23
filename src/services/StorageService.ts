import { adminStorageBucket } from "@/firebase/firebaseAdmin";

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
