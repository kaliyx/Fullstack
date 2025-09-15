const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const db = require('./database');
const { authenticateToken, generateToken } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from HUERTOHOGAR directory
app.use(express.static(path.join(__dirname, '../HUERTOHOGAR')));

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `);
    
    const result = insertUser.run(name, email, passwordHash);
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, address, avatar_url, created_at 
      FROM users WHERE id = ?
    `).get(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Profile routes
app.get('/api/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, address, avatar_url, created_at 
      FROM users WHERE id = ?
    `).get(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, avatar_url, password } = req.body;
    const userId = req.user.userId;

    // Start building the update query
    let updateFields = [];
    let updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email) {
      // Check if email is already taken by another user
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (avatar_url) {
      updateFields.push('avatar_url = ?');
      updateValues.push(avatar_url);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      updateValues.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(userId);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    db.prepare(updateQuery).run(...updateValues);

    // Return updated user
    const updatedUser = db.prepare(`
      SELECT id, name, email, phone, address, avatar_url, created_at 
      FROM users WHERE id = ?
    `).get(userId);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Orders routes
app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const { items, total } = req.body;
    const userId = req.user.userId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: 'Valid total is required' });
    }

    // Begin transaction
    const insertOrder = db.prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)');
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, name, price, qty) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      // Create order
      const orderResult = insertOrder.run(userId, total);
      const orderId = orderResult.lastInsertRowid;

      // Add order items
      for (const item of items) {
        if (!item.product_id || !item.name || !item.price || !item.qty) {
          throw new Error('Invalid item data');
        }
        insertOrderItem.run(orderId, item.product_id, item.name, item.price, item.qty);
      }

      return orderId;
    });

    const orderId = transaction();

    res.status(201).json({
      message: 'Order created successfully',
      orderId: orderId
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    // Get orders with items
    const orders = db.prepare(`
      SELECT o.id, o.total, o.created_at,
             oi.product_id, oi.name, oi.price, oi.qty
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(userId);

    // Group items by order
    const ordersMap = {};
    orders.forEach(row => {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          total: row.total,
          created_at: row.created_at,
          items: []
        };
      }
      if (row.product_id) {
        ordersMap[row.id].items.push({
          product_id: row.product_id,
          name: row.name,
          price: row.price,
          qty: row.qty
        });
      }
    });

    res.json(Object.values(ordersMap));
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Root route - serve home.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../HUERTOHOGAR/home.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;