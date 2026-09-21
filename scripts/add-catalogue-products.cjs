require("dotenv/config");

const { randomUUID } = require("crypto");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const catalogue = [
  {
    category: {
      name: "Boubous & Kaftans",
      slug: "boubous-kaftans",
      description: "Relaxed, expressive pieces for effortless dressing.",
    },
    product: {
      name: "Magenta Balloon-Sleeve Boubou",
      slug: "magenta-balloon-sleeve-boubou",
      description:
        "A flowing magenta boubou with statement balloon sleeves and a striped V-neck trim. Made for easy, elegant dressing when comfort and presence matter equally.",
      price: "50000.00",
      inventory: 20,
      sku: "GSF-BOU-001",
      sizes: ["One Size"],
      materials: "Glossy satin-look fabric with woven striped trim.",
      care: "Dry clean recommended. Steam gently on low heat and store away from direct sunlight.",
      images: [
        "/products/magenta-balloon-sleeve-boubou.png",
        "/products/magenta-balloon-sleeve-boubou-back.png",
        "/products/magenta-balloon-sleeve-boubou-detail.png",
      ],
    },
  },
  {
    category: {
      name: "Custom Traditional Wear",
      slug: "custom-traditional-wear",
      description: "Made-to-order occasion pieces with elevated traditional detailing.",
    },
    product: {
      name: "Bronze Beaded Custom Occasion Gown",
      slug: "bronze-beaded-custom-occasion-gown",
      description:
        "A fitted custom occasion gown in nude mesh with bronze and gold beadwork. The corset-inspired bodice, delicate straps, and hand-finished floral embellishment make it a statement piece for celebrations and formal events.",
      price: "250000.00",
      inventory: 5,
      sku: "GSF-CUS-001",
      sizes: ["S", "M", "L", "XL"],
      materials: "Beaded tulle, sheer mesh, and structured lining.",
      care: "Professional dry clean only. Handle beadwork with care and store flat or on a padded hanger.",
      images: [
        "/products/bronze-beaded-custom-gown.png",
        "/products/bronze-beaded-custom-gown-back.png",
        "/products/bronze-beaded-custom-gown-detail.png",
      ],
    },
  },
];

async function ensureCategory(category) {
  const [existing] = await sql.query(
    "select id from categories where slug = $1 limit 1",
    [category.slug],
  );
  if (existing) return existing.id;

  const id = randomUUID();
  await sql.query(
    "insert into categories (id, name, slug, description) values ($1, $2, $3, $4)",
    [id, category.name, category.slug, category.description],
  );
  return id;
}

async function upsertProduct(categoryId, product) {
  const [existing] = await sql.query(
    "select id from products where slug = $1 limit 1",
    [product.slug],
  );
  const productId = existing?.id || randomUUID();

  if (existing) {
    await sql.query(
      `update products set "Product_name" = $1, description = $2, price = $3, category_id = $4,
       inventory_count = $5, sku = $6, is_active = true, featured = false, sizes = $7::jsonb,
       materials = $8, care_instructions = $9, updated_at = now() where id = $10`,
      [
        product.name,
        product.description,
        product.price,
        categoryId,
        product.inventory,
        product.sku,
        JSON.stringify(product.sizes),
        product.materials,
        product.care,
        productId,
      ],
    );
    await sql.query("delete from product_images where product_id = $1", [productId]);
  } else {
    await sql.query(
      `insert into products (id, "Product_name", slug, description, price, category_id, inventory_count, sku,
       is_active, featured, sizes, materials, care_instructions)
       values ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9::jsonb, $10, $11)`,
      [
        productId,
        product.name,
        product.slug,
        product.description,
        product.price,
        categoryId,
        product.inventory,
        product.sku,
        JSON.stringify(product.sizes),
        product.materials,
        product.care,
      ],
    );
  }

  for (const [displayOrder, imageUrl] of product.images.entries()) {
    await sql.query(
      "insert into product_images (product_id, image_url, alt_text, display_order) values ($1, $2, $3, $4)",
      [productId, imageUrl, `${product.name} ${["front view", "back view", "detail view"][displayOrder]}`, displayOrder],
    );
  }
  return productId;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  for (const entry of catalogue) {
    const categoryId = await ensureCategory(entry.category);
    const productId = await upsertProduct(categoryId, entry.product);
    console.log(`Saved ${entry.product.name} (${productId}).`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
