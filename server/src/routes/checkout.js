const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// Checkout endpoint - vulnerable to business logic abuse
router.post('/', (req, res) => {
  try {
    const { items, total, discount, couponCode, paymentMethod } = req.body;
    
    // VULNERABILITY: Accepts total from client without server-side validation
    let calculatedTotal = 0;
    if (items && Array.isArray(items)) {
      calculatedTotal = items.reduce((sum, item) => {
        // VULNERABILITY: Uses client-provided item prices
        return sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
      }, 0);
    }
    
    // VULNERABILITY: Uses client-provided total instead of calculated
    const finalTotal = total !== undefined ? parseFloat(total) : calculatedTotal;
    
    // Apply discount if provided (vulnerable to negative discount abuse)
    const discountedTotal = discount ? finalTotal - parseFloat(discount) : finalTotal;
    
    logger.warn(`Checkout attempt - Client Total: ${total}, Calculated: ${calculatedTotal}, Final: ${discountedTotal}`);
    
    // Business logic abuse: negative totals, excessive discounts
    if (discountedTotal < 0) {
      logger.warn(`Business logic abuse detected: Negative total ${discountedTotal}`);
    }
    
    res.json({ 
      message: 'Order placed successfully',
      orderId: `ORD-${Date.now()}`,
      total: discountedTotal,
      items: items || [],
      couponCode: couponCode || null
    });
  } catch (error) {
    logger.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

module.exports = router;
