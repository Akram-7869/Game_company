const express = require('express');
const {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,chkPin,setPin, getMe,debiteAmount,playerInfo
} = require('../controllers/players');

const Player = require('../models/Player');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
//router.use(protect);
//router.use(authorize('admin','Player'));
router.post('/pin',protect, setPin);
router.post('/checkpin',protect, chkPin);
//router.post('/player/join', protect, join);
router.post('/debit', protect, debiteAmount);
router.get('/info', protect, playerInfo);
router.route('/').post( getPlayers);
//router.route('/add').post(createPlayer);
router
  .route('/:id')
  .get(getPlayer)
  .post(updatePlayer)
  .delete(deletePlayer);

module.exports = router;
