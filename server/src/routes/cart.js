const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// Fake products database
const PRODUCTS = [
  { id: 1, name: 'Glowing Serum', price: 49.99, category: 'skincare' },
  { id: 2, name: 'Hydrating Mask', price: 29.99, category: 'skincare' },
  { id: 3, name: 'Luxury Lipstick', price: 24.99, category: 'makeup' },
  { id: 4, name: 'Mascara Pro', price: 19.99, category: 'makeup' },
  { id: 5, name: 'Anti-Aging Cream', price: 79.99, category: 'skincare' }
];

// Add to cart - VULNERABLE to price tampering
router.post('/add', (req, res) => {
  try {
    const { productId, quantity = 1, price } = req.body;
    
    // VULNERABILITY: Accepts price from client - should use server-side price
    const product = PRODUCTS.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Intentionally use client-provided price if given (price tampering vulnerability)
    const itemPrice = price !== undefined ? parseFloat(price) : product.price;
    
    const cartItem = {
      productId,
      name: product.name,
      quantity: parseInt(quantity),
      price: itemPrice, // VULNERABLE: Using client-provided price
      total: itemPrice * parseInt(quantity)
    };
    
    logger.info(`Cart add - Product: ${product.name}, Price: ${itemPrice}, Client Price: ${price}`);
    
    res.json({ 
      message: 'Item added to cart',
      item: cartItem
    });
  } catch (error) {
    logger.error('Cart add error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart - VULNERABLE to price manipulation
router.post('/update', (req, res) => {
  try {
    const { itemId, quantity, price } = req.body;
    
    // VULNERABILITY: Allows price modification
    if (price !== undefined) {
      logger.warn(`Price manipulation attempt: itemId=${itemId}, newPrice=${price}`);
    }
    
    const updatedItem = {
      itemId,
      quantity: quantity || 1,
      price: price || 0, // VULNERABLE: Accepts client price
      total: (price || 0) * (quantity || 1)
    };
    
    res.json({ 
      message: 'Cart updated',
      item: updatedItem
    });
  } catch (error) {
    logger.error('Cart update error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Get cart
router.get('/', (req, res) => {
  res.json({ 
    items: [],
    total: 0,
    message: 'Cart retrieved (empty by default)'
  });
});

module.exports = router;
