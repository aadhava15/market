import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./src/db.ts";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
      if (user) {
        console.log(`Login successful for user: ${username}, role: ${user.role}`);
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
      } else {
        console.log(`Login failed for user: ${username} - Invalid credentials`);
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalStock = db.prepare('SELECT SUM(quantity) as sum FROM products').get().sum || 0;
    const totalSales = 0; // Placeholder as sales table isn't implemented yet
    res.json({ totalProducts, totalStock, totalSales });
  });

  // Vendors
  app.get("/api/vendors", (req, res) => {
    const vendors = db.prepare('SELECT * FROM vendors').all();
    res.json(vendors);
  });

  app.post("/api/vendors", (req, res) => {
    const { name, contact, address } = req.body;
    const result = db.prepare('INSERT INTO vendors (name, contact, address) VALUES (?, ?, ?)').run(name, contact, address);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/vendors/:id", (req, res) => {
    const { name, contact, address } = req.body;
    const { id } = req.params;
    db.prepare('UPDATE vendors SET name = ?, contact = ?, address = ? WHERE id = ?').run(name, contact, address, id);
    res.json({ success: true });
  });

  app.delete("/api/vendors/:id", (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM vendors WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Categories
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Category already exists" });
    }
  });

  app.put("/api/categories/:id", (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    try {
      db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to delete category. It might be in use." });
    }
  });

  // Products & Purchase Entries
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `).all();
    res.json(products);
  });

  app.post("/api/purchase", (req, res) => {
    const {
      vendor_id,
      purchase_date,
      item_code,
      item_name,
      category_id,
      unit,
      weight,
      quantity,
      rate,
      pn,
      kn,
      per_kg_rate,
      barcode_number
    } = req.body;

    const transaction = db.transaction(() => {
      // Insert Purchase Entry
      db.prepare(`
        INSERT INTO purchase_entries (
          vendor_id, purchase_date, item_code, item_name, category_id, 
          unit, weight, quantity, rate, pn, kn, per_kg_rate, barcode_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(vendor_id, purchase_date, item_code, item_name, category_id, unit, weight, quantity, rate, pn, kn, per_kg_rate, barcode_number);

      // Update or Insert Product Stock
      const existingProduct = db.prepare('SELECT * FROM products WHERE item_code = ?').get(item_code);
      if (existingProduct) {
        db.prepare('UPDATE products SET quantity = quantity + ?, rate = ? WHERE item_code = ?')
          .run(quantity, rate, item_code);
      } else {
        db.prepare(`
          INSERT INTO products (item_code, item_name, category_id, barcode_number, quantity, rate, unit)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(item_code, item_name, category_id, barcode_number, quantity, rate, unit);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save purchase" });
    }
  });

  // Search by Barcode
  app.get("/api/products/barcode/:code", (req, res) => {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode_number = ?
    `).get(req.params.code);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });

  // Users
  app.get("/api/users", (req, res) => {
    // In a real app, we'd check the session/token here
    const users = db.prepare('SELECT id, username, role FROM users').all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role, requesterRole } = req.body;
    if (requesterRole !== 'admin') {
      return res.status(403).json({ error: "Only admins can create users" });
    }
    try {
      const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, role || 'viewer');
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { username, password, role, requesterRole } = req.body;
    const { id } = req.params;
    if (requesterRole !== 'admin') {
      return res.status(403).json({ error: "Only admins can update users" });
    }
    try {
      if (password) {
        db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?').run(username, password, role, id);
      } else {
        db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, role, id);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { requesterRole } = req.query;
    if (requesterRole !== 'admin') {
      return res.status(403).json({ error: "Only admins can delete users" });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    
    // Serve static files from the dist directory
    app.use(express.static(distPath));
    
    // SPA Fallback: Serve index.html for any unknown routes
    app.get("*", (req, res) => {
      // Skip API routes to avoid infinite loops or wrong responses
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
