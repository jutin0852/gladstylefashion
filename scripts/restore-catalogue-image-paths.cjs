require("dotenv/config");

const { neon } = require("@neondatabase/serverless");

const originalPaths = [
  "/products/black-mustard-floral-maxi-dress-ai.png",
  "/products/black-mustard-floral-maxi-dress-back.png",
  "/products/black-mustard-floral-maxi-dress-detail.png",
  "/products/blue-polka-dot-maxi-dress-back.png",
  "/products/blue-polka-dot-maxi-dress-detail.png",
  "/products/blue-polka-dot-maxi-dress.png",
  "/products/bronze-beaded-custom-gown-back.png",
  "/products/bronze-beaded-custom-gown-detail.png",
  "/products/bronze-beaded-custom-gown.png",
  "/products/magenta-balloon-sleeve-boubou-back.png",
  "/products/magenta-balloon-sleeve-boubou-detail.png",
  "/products/magenta-balloon-sleeve-boubou.png",
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const sql = neon(process.env.DATABASE_URL);
  for (const originalPath of originalPaths) {
    const optimizedPath = originalPath.replace(/\.png$/, ".webp");
    await sql.query("update product_images set image_url = $1 where image_url = $2", [originalPath, optimizedPath]);
  }
  console.log("Restored the 12 known catalogue image paths.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
