const express = require('express');
const router = express.Router();

const siteRoutes = require('../routers/site');
const adminRoutes = require('../routers/admin');
const influencerRoutes = require('../routers/influencer');
const franchiseRoutes = require('../routers/franchise');








router.use('/', siteRoutes);
router.use('/admin',adminRoutes);
router.use('/influencer',influencerRoutes);
router.use('/franchise', franchiseRoutes);

// Mount routers

module.exports = router;