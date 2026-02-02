// cloudinary.ts
export const uploadToCloudinary = async (
  files: File | File[],
): Promise<string | string[]> => {
  // normalize to array
  const fileArray = Array.isArray(files) ? files : [files];

  const sigRes = await fetch("/api/cloudinary-signature", { method: "POST" });
  const sigData = await sigRes.json();
  const { timestamp, signature, cloudName, apiKey } = sigData;

  // upload each file
  const urls = await Promise.all(
    fileArray.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", "uploads");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );

      if (!res.ok) {
        const text = await res.text(); // debug
        throw new Error(`Cloudinary upload failed: ${text}`);
      }

      const data = await res.json();
      return data.secure_url as string;
    }),
  );

  // return string for single, array for multiple
  return Array.isArray(files) ? urls : urls[0];
};

export const handlecloudinaryUpload = async (images: File[] | File) => {
  const urls = await uploadToCloudinary(images);
  console.log(urls); // string[]
  return [...urls];
};
