const express = require('express');
const router = express.Router();

const siteRoutes = require('../routers/site');
const adminRoutes = require('../routers/admin');
const influencerRoutes = require('../routers/influencer');









router.use('/', siteRoutes);
router.use('/admin', adminRoutes);
router.use('/influencer', influencerRoutes);

// Mount routers

module.exports = router;