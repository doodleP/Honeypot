const express = require('express');
const Coupon = require('../models/Coupon');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize some fake coupons
const initializeCoupons = async () => {
  try {
    const count = await Coupon.countDocuments();
    if (count === 0) {
      await Coupon.create([
        { code: 'WELCOME10', discount: 10, discountType: 'percentage', minPurchase: 50 },
        { code: 'SAVE20', discount: 20, discountType: 'percentage', minPurchase: 100 },
        { code: 'FREESHIP', discount: 5, discountType: 'fixed', minPurchase: 25 }
      ]);
    }
  } catch (error) {
    logger.error('Failed to initialize coupons:', error);
  }
};

initializeCoupons();

// Apply coupon - VULNERABLE to abuse
router.get('/apply', async (req, res) => {
  try {
    const { code, amount } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Coupon code required' });
    }
    
    // VULNERABILITY: No rate limiting, allows brute force attempts
    // VULNERABILITY: Case-insensitive search allows easy enumeration
    const coupon = await Coupon.findOne({ 
      code: { $regex: new RegExp(`^${code}$`, 'i') },
      isActive: true
    });
    
    if (!coupon) {
      // Log failed attempts for analysis
      logger.info(`Invalid coupon attempt: ${code}`);
      return res.status(404).json({ error: 'Invalid coupon code' });
    }
    
    // VULNERABILITY: No usage limit enforcement in this endpoint
    // VULNERABILITY: No check for expired coupons
    const purchaseAmount = parseFloat(amount) || 0;
    
    if (purchaseAmount < coupon.minPurchase) {
      return res.status(400).json({ 
        error: `Minimum purchase of $${coupon.minPurchase} required` 
      });
    }
    
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (purchaseAmount * coupon.discount) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discount;
    }
    
    // VULNERABILITY: Increment usage but don't enforce limits properly
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    await coupon.save();
    
    res.json({
      valid: true,
      code: coupon.code,
      discount: discount.toFixed(2),
      discountType: coupon.discountType,
      finalAmount: (purchaseAmount - discount).toFixed(2)
    });
  } catch (error) {
    logger.error('Coupon apply error:', error);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

// List all coupons (vulnerability: information disclosure)
router.get('/list', async (req, res) => {
  try {
    // VULNERABILITY: Exposes all coupon codes
    const coupons = await Coupon.find({ isActive: true });
    res.json({ coupons: coupons.map(c => ({ code: c.code, discount: c.discount })) });
  } catch (error) {
    logger.error('Coupon list error:', error);
    res.status(500).json({ error: 'Failed to list coupons' });
  }
});

module.exports = router;
