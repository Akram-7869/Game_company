
const express = require('express');
const router = express.Router();
// Route files
const auth = require('./auth');
const players = require('./players');
const settings = require('./settings');
const transactions = require('./transactions');
const payments = require('./payments');
const managers = require('./users');
const bots = require('./bots');
const versions = require('./versions');
const banners = require('./banners');
//const tickets = require('./tickets');
const notifications = require('./notifications');
const game = require('./game');
const dashboards = require('./dashboard');
const tournaments = require('./tournament');
const coupon = require('./coupon');
const polls = require('./polls');
const gamemanager = require('./gameManager');
const bannertext = require('./bannertext');
const JoinRoom = require('../utils/JoinRoom');
const posts = require('./posts');
const faqs = require('./faqs');
const franchises = require('./franchises');
const influencers = require('./influencers');
const commission = require('./commission');

const { state} = require('../utils/JoinRoom');



// Mount routers
router.use('/api/v1/auth', auth);
router.use('/api/v1/players', players);
router.use('/api/v1/settings', settings);
router.use('/api/v1/transactions', transactions);
router.use('/api/v1/managers', managers);
router.use('/api/v1/versions', versions);
router.use('/api/v1/bots', bots);
//router.use('/api/v1/tickets', tickets);
router.use('/api/v1/payments', payments);
router.use('/api/v1/notifications', notifications);
router.use('/api/v1/banners', banners);
router.use('/api/v1/games', game);
router.use('/api/v1/dashboards', dashboards);
router.use('/api/v1/tournaments', tournaments);
router.use('/api/v1/coupon', coupon);
router.use('/api/v1/polls', polls);
router.use('/api/v1/gamemanager', gamemanager);
router.use('/api/v1/bannertext', bannertext);
router.use('/api/v1/posts', posts);
router.use('/api/v1/faqs', faqs);
router.use('/api/v1/franchises', franchises);
router.use('/api/v1/influencers', influencers);
router.use('/api/v1/commissions', commission);




router.get('/api/v1/so', function (req, res, next) {
    console.log(Object.keys(state).length)
})
 



module.exports = router;