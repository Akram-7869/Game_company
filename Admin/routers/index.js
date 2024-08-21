const express = require('express');
const router = express.Router();

const siteRoutes = require('../routers/site');
const adminRoutes = require('../routers/admin');
const influencerRoutes = require('../routers/influencer');
const frenchiseRoutes = require('../routers/frenchise');









router.use('/', siteRoutes);
router.use('/admin', adminRoutes);
router.use('/influencer', influencerRoutes);
router.use('/frenchise', frenchiseRoutes);

// Mount routers

module.exports = router;