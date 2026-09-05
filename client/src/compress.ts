import imageCompression from "browser-image-compression";

export async function compressPhoto(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1.2,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.8,
  });

  return new File([compressed], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });
}
