const express = require('express');
const {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,deletePlayer,chkPin,setPin, getMe,debiteAmount,playerInfo,updateStatus,creditAmount,join,
  getOnlinePlayers,getNotication,getPage
  
} = require('../controllers/players');

const Player = require('../models/Player');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
//router.use(protect);
//router.use(authorize('admin','Player'));
router.post('/status/:id',protect, updateStatus);

router.get('/page',protect, getPage);

router.get('/notification',protect, getNotication);
router.post('/pin',protect, setPin);
router.post('/checkpin', chkPin);
router.post('/game/join', protect, join);
router.post('/debit', protect, debiteAmount);
router.post('/credit/:id', protect, creditAmount);
router.get('/info', protect, playerInfo);
router.get('/online', protect, getOnlinePlayers);
router.route('/').post(protect, getPlayers);
//router.route('/add').post(createPlayer);
router
  .route('/:id')
  .get(protect,getPlayer)
  .post(protect,updatePlayer)
  .delete(protect,deletePlayer);

module.exports = router;
