const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

const port = Number(process.env.PORT || 3000);
const adminKey = process.env.ADMIN_KEY || "vibe-admin";

const uploadDirectory = path.join(__dirname, "assets", "images", "products");

// Create the products image folder automatically
fs.mkdirSync(uploadDirectory, { recursive: true });

// ============================================================
// MULTER IMAGE UPLOAD CONFIGURATION
// ============================================================

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const baseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const uniqueName = `${baseName}-${Date.now()}${extension}`;

    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (request, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, WEBP and GIF images are allowed."),
      );
    }

    callback(null, true);
  },
});

// ============================================================
// POSTGRESQL CONNECTION
// ============================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend from public/
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

function requireAdmin(request, response, next) {
  if (
    request.get("x-admin-key") !== adminKey &&
    request.query.key !== adminKey
  ) {
    return response.status(401).json({
      error: "Admin access required",
    });
  }

  next();
}

// ============================================================
// SEED PRODUCTS
// ============================================================

const seedProducts = [
  [
    "Dahua 4K IP Speed Dome PTZ",
    "cctv",
    "25x Optical Zoom, Starlight Night Vision, Smart AI Human Detection & Auto-Tracking.",
    0,
    10,
    "assets/images/cctv-bg.jpg",
  ],

  [
    "Dahua Pro 16-Channel 4K NVR",
    "cctv",
    "Supports up to 16 IP cameras with centralized storage.",
    0,
    8,
    "assets/images/server.jpg",
  ],

  [
    "24-Port Gigabit Managed Switch",
    "network",
    "PoE+ ports, SFP optical ports, VLAN support, and managed control.",
    0,
    15,
    "assets/images/network.jpg",
  ],

  [
    "AX3000 Dual-Band Wi-Fi 6 AP",
    "network",
    "High-capacity wireless access point with PoE power.",
    0,
    12,
    "assets/images/network.jpg",
  ],

  [
    "Dell OptiPlex Tower Workstation",
    "computing",
    "Intel Core i7, 16GB RAM, 512GB NVMe SSD, Windows 11 Pro.",
    0,
    6,
    "assets/images/image.jpg",
  ],

  [
    "HP ProBook 15.6 Full HD",
    "computing",
    "Intel Core i5, 16GB RAM, 512GB SSD, and backlit keyboard.",
    0,
    5,
    "assets/images/image.jpg",
  ],

  [
    "Genuine Windows 11 Pro License",
    "accessories",
    "Original Microsoft activation key with lifetime updates.",
    0,
    25,
    "assets/images/image.jpg",
  ],

  [
    "Cat6 Pure Copper UTP Cable Box",
    "accessories",
    "305m gigabit-certified network cable box.",
    0,
    20,
    "assets/images/network.jpg",
  ],
];

async function seedDatabase() {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS count FROM products",
  );

  if (result.rows[0].count > 0) {
    return;
  }

  console.log("No products found. Seeding products...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const product of seedProducts) {
      await client.query(
        `
        INSERT INTO products
        (
          name,
          category,
          description,
          price,
          stock,
          image
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO NOTHING
        `,
        product,
      );
    }

    await client.query("COMMIT");

    console.log("✅ Products seeded successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================
// GET PRODUCTS
// ============================================================

app.get("/api/products", async (request, response) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM products
      ORDER BY id DESC
    `);

    response.json(result.rows);
  } catch (error) {
    console.error("GET /api/products error:", error);

    response.status(500).json({
      error: "Failed to load products",
    });
  }
});

// ============================================================
// CREATE ORDER
// ============================================================

// ============================================================
// CREATE ORDER
// TRANSACTION-SAFE STOCK MANAGEMENT
// ============================================================
app.post("/api/orders", async (request, response) => {
  const client = await pool.connect();

  try {
    const {
      product_id,
      customer_name,
      email,
      phone = "",
      quantity = 1,
      message = "",
    } = request.body;

    const numericQuantity = Number(quantity);

    // ----------------------------------------------------------
    // Validate customer information
    // ----------------------------------------------------------

    if (
      !customer_name ||
      !email ||
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 1
    ) {
      return response.status(400).json({
        error: "Customer name, email, and a valid quantity are required",
      });
    }

    // ----------------------------------------------------------
    // Start database transaction
    // ----------------------------------------------------------

    await client.query("BEGIN");

    let product = null;

    // ----------------------------------------------------------
    // Check and LOCK product row
    //
    // FOR UPDATE prevents two customers from purchasing the
    // same remaining stock simultaneously.
    // ----------------------------------------------------------

    if (product_id) {
      const productResult = await client.query(
        `
        SELECT
          id,
          name,
          stock
        FROM products
        WHERE id = $1
        FOR UPDATE
        `,
        [product_id],
      );

      product = productResult.rows[0];

      // Product does not exist
      if (!product) {
        await client.query("ROLLBACK");

        return response.status(404).json({
          error: "Product not found",
        });
      }

      // --------------------------------------------------------
      // Check available stock
      // --------------------------------------------------------

      if (product.stock < numericQuantity) {
        await client.query("ROLLBACK");

        return response.status(409).json({
          error: `Only ${product.stock} item(s) are currently in stock`,
        });
      }

      // --------------------------------------------------------
      // Decrease stock
      // --------------------------------------------------------

      await client.query(
        `
        UPDATE products
        SET
          stock = stock - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [numericQuantity, product_id],
      );
    }

    // ----------------------------------------------------------
    // Create the order
    // ----------------------------------------------------------

    const orderResult = await client.query(
      `
      INSERT INTO orders
      (
        product_id,
        customer_name,
        email,
        phone,
        quantity,
        message
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        status,
        created_at
      `,
      [
        product_id || null,
        customer_name,
        email,
        phone,
        numericQuantity,
        message,
      ],
    );

    // ----------------------------------------------------------
    // Everything succeeded
    // Commit both:
    //
    // 1. Stock reduction
    // 2. Order creation
    // ----------------------------------------------------------

    await client.query("COMMIT");

    response.status(201).json({
      success: true,
      id: orderResult.rows[0].id,
      status: orderResult.rows[0].status,
      created_at: orderResult.rows[0].created_at,
      message: "Order submitted successfully",
    });
  } catch (error) {
    // ----------------------------------------------------------
    // Something failed.
    //
    // Roll back BOTH the order and stock change.
    // ----------------------------------------------------------

    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }

    console.error("POST /api/orders error:", error);

    response.status(500).json({
      error: "Failed to create order",
    });
  } finally {
    // ----------------------------------------------------------
    // Always return the PostgreSQL connection to the pool
    // ----------------------------------------------------------

    client.release();
  }
});

// ============================================================
// ADMIN - GET PRODUCTS
// ============================================================

app.get("/api/admin/products", requireAdmin, async (request, response) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM products
      ORDER BY id DESC
    `);

    response.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/products error:", error);

    response.status(500).json({
      error: "Failed to load products",
    });
  }
});

// ============================================================
// ADMIN - CREATE PRODUCT
// ============================================================

// ============================================================
// ADMIN - CREATE PRODUCT WITH IMAGE UPLOAD
// ============================================================

app.post(
  "/api/admin/products",
  requireAdmin,
  upload.single("image"),
  async (request, response) => {
    try {
      const {
        name,
        category,
        description = "",
        price = 0,
        stock = 0,
      } = request.body;

      // --------------------------------------------------------
      // Validate required fields
      // --------------------------------------------------------

      if (!name || !category) {
        if (request.file) {
          fs.unlinkSync(request.file.path);
        }

        return response.status(400).json({
          error: "Product name and category are required",
        });
      }

      // --------------------------------------------------------
      // Validate price and stock
      // --------------------------------------------------------

      const numericPrice = Number(price);
      const numericStock = Number(stock);

      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        if (request.file) {
          fs.unlinkSync(request.file.path);
        }

        return response.status(400).json({
          error: "Price must be a valid positive number",
        });
      }

      if (!Number.isInteger(numericStock) || numericStock < 0) {
        if (request.file) {
          fs.unlinkSync(request.file.path);
        }

        return response.status(400).json({
          error: "Stock must be a valid non-negative integer",
        });
      }

      // --------------------------------------------------------
      // Save relative image path
      // --------------------------------------------------------

      const imagePath = request.file
        ? `/assets/images/products/${request.file.filename}`
        : "";

      // --------------------------------------------------------
      // Insert product into PostgreSQL
      // --------------------------------------------------------

      const result = await pool.query(
        `
        INSERT INTO products
        (
          name,
          category,
          description,
          price,
          stock,
          image
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          name,
          category,
          description,
          price,
          stock,
          image
        `,
        [
          name.trim(),
          category.trim(),
          description.trim(),
          numericPrice,
          numericStock,
          imagePath,
        ],
      );

      response.status(201).json({
        success: true,
        product: result.rows[0],
        redirect: `/products.html?category=${encodeURIComponent(result.rows[0].category)}#products-grid`,
        message: "Product created successfully",
      });
    } catch (error) {
      console.error("POST /api/admin/products error:", error);

      // --------------------------------------------------------
      // If database insertion failed, remove uploaded image
      // --------------------------------------------------------

      if (request.file) {
        try {
          fs.unlinkSync(request.file.path);
        } catch (cleanupError) {
          console.error("Failed to remove uploaded image:", cleanupError);
        }
      }

      if (error.code === "23505") {
        return response.status(409).json({
          error: "A product with this name already exists",
        });
      }

      response.status(500).json({
        error: "Failed to create product",
      });
    }
  },
);
// ============================================================
// ADMIN - UPDATE PRODUCT
// ============================================================

app.patch(
  "/api/admin/products/:id",
  requireAdmin,
  async (request, response) => {
    try {
      const fields = [
        "name",
        "category",
        "description",
        "price",
        "stock",
        "image",
      ];

      const updates = fields.filter(
        (field) => request.body[field] !== undefined,
      );

      if (!updates.length) {
        return response.status(400).json({
          error: "No fields to update",
        });
      }

      const values = [];
      const assignments = [];

      updates.forEach((field, index) => {
        let value = request.body[field];

        if (field === "price" || field === "stock") {
          value = Number(value);
        }

        values.push(value);
        assignments.push(`${field} = $${index + 1}`);
      });

      values.push(request.params.id);

      const result = await pool.query(
        `
        UPDATE products
        SET
          ${assignments.join(", ")},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        `,
        values,
      );

      if (result.rowCount === 0) {
        return response.status(404).json({
          error: "Product not found",
        });
      }

      response.json({
        updated: true,
      });
    } catch (error) {
      console.error("PATCH /api/admin/products error:", error);

      response.status(500).json({
        error: "Failed to update product",
      });
    }
  },
);

// ============================================================
// ADMIN - DELETE PRODUCT
// ============================================================

app.delete(
  "/api/admin/products/:id",
  requireAdmin,
  async (request, response) => {
    try {
      const result = await pool.query(
        `
        DELETE FROM products
        WHERE id = $1
        `,
        [request.params.id],
      );

      if (result.rowCount === 0) {
        return response.status(404).json({
          error: "Product not found",
        });
      }

      response.status(204).end();
    } catch (error) {
      console.error("DELETE /api/admin/products error:", error);

      response.status(500).json({
        error: "Failed to delete product",
      });
    }
  },
);

// ============================================================
// ADMIN - GET ORDERS
// ============================================================

app.get("/api/admin/orders", requireAdmin, async (request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        orders.*,
        products.name AS product_name
      FROM orders
      LEFT JOIN products
        ON products.id = orders.product_id
      ORDER BY orders.created_at DESC
    `);

    response.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);

    response.status(500).json({
      error: "Failed to load orders",
    });
  }
});

// ============================================================
// ADMIN - UPDATE ORDER STATUS
// ============================================================

app.patch("/api/admin/orders/:id", requireAdmin, async (request, response) => {
  try {
    const allowedStatuses = ["new", "processing", "completed", "cancelled"];

    if (!allowedStatuses.includes(request.body.status)) {
      return response.status(400).json({
        error: "Invalid order status",
      });
    }

    const result = await pool.query(
      `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        `,
      [request.body.status, request.params.id],
    );

    if (result.rowCount === 0) {
      return response.status(404).json({
        error: "Order not found",
      });
    }

    response.json({
      updated: true,
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders error:", error);

    response.status(500).json({
      error: "Failed to update order",
    });
  }
});

// ============================================================
// ADMIN DASHBOARD
// ============================================================

app.get("/admin", (request, response) => {
  response.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  try {
    await pool.query("SELECT NOW()");

    console.log("✅ PostgreSQL connected successfully.");

    await seedDatabase();

    app.listen(port, () => {
      console.log(`🚀 Vibe store backend running at http://localhost:${port}`);

      console.log(`📊 Products API: http://localhost:${port}/api/products`);

      console.log(`🔐 Admin dashboard: http://localhost:${port}/admin`);
    });
  } catch (error) {
    console.error("❌ Failed to start server.");
    console.error(error.message);

    process.exit(1);
  }
}

startServer();
