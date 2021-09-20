const express = require('express');
const {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer, deletePlayer, chkPin, setPin, getMe, debiteAmount, playerInfo, updateStatus, creditAmount,
  join, won,
  ticketAdd, ticketList, ticketReply,
  getOnlinePlayers, getNotication, getPage, editOnlinePlayers,
  withDrawRequest, addMoney, addWallet, addBank, updatePlayerImage

} = require('../controllers/players');

const Player = require('../models/Player');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
//router.use(protect);
//router.use(authorize('admin','Player'));
router.post('/status/:id', protect, updateStatus);

router.get('/page', protect, getPage);

router.route('/profile').get(protect, getPlayer).post(protect, updatePlayer);
router.route('/profile/image').post(protect, updatePlayerImage);
router.get('/notification', protect, getNotication);
router.post('/pin', protect, setPin);
router.post('/checkpin', chkPin);
// router.post('/game/join', protect, join);
// router.post('/game/won', protect, won);
router.post('/ticket/add', protect, ticketAdd);
router.post('/ticket/reply', protect, ticketReply);
router.get('/ticket/', protect, ticketList);
router.post('/withdraw/request', protect, withDrawRequest);
router.post('/debit', protect, debiteAmount);
router.post('/credit/', protect, creditAmount);
router.post('/addMoney/', protect, addMoney);
router.get('/info', protect, playerInfo);
router.route('/online').get(protect, getOnlinePlayers).post(editOnlinePlayers);
router.route('/').post(protect, getPlayers);

router.route('/bank').post(protect, addBank);
router.route('/wallet').post(protect, addWallet);
router
  .route('/:id')
  .get(protect, getPlayer)
  .post(protect, updatePlayer)
  .delete(protect, deletePlayer);

module.exports = router;
