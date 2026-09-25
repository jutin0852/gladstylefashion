require("dotenv/config");

const { neon } = require("@neondatabase/serverless");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const sql = neon(process.env.DATABASE_URL);
  await sql.query(
    "update product_images set image_url = regexp_replace(image_url, '\\.(png|jpg|jpeg)$', '.webp') where image_url ~ '^/products/.+\\.(png|jpg|jpeg)$'",
  );
  const rows = await sql.query("select image_url from product_images order by image_url");
  console.log(rows.map((row) => row.image_url).join("\n"));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
