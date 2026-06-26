const MAX_AVATAR_BYTES = 120_000;
const MAX_DIMENSION = 256;

export async function compressAvatarFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  let { width, height } = bitmap;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width >= height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.82, 0.68, 0.52, 0.38, 0.3]) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= MAX_AVATAR_BYTES) {
      return new File([blob], "avatar.jpg", { type: "image/jpeg" });
    }
  }

  const blob = await canvasToBlob(canvas, 0.25);
  if (!blob || blob.size > MAX_AVATAR_BYTES) {
    throw new Error("Image is too large. Try a smaller photo.");
  }

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}
