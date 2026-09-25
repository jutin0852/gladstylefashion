const MAX_PRODUCT_IMAGE_DIMENSION = 1600;
const PRODUCT_IMAGE_QUALITY = 0.82;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be prepared for upload."));
    };
    image.src = url;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed."))),
      "image/webp",
      PRODUCT_IMAGE_QUALITY,
    );
  });
}

/**
 * Creates the only product-photo copy that is sent to Cloudinary. Originals
 * stay with the merchant, while the store receives a 1600px WebP suitable for
 * product pages and high-density mobile displays.
 */
export async function compressProductImage(file: File): Promise<File> {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_PRODUCT_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image compression is unavailable in this browser.");
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToWebp(canvas);
  if (blob.size >= file.size && scale === 1) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export async function compressProductImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressProductImage));
}
