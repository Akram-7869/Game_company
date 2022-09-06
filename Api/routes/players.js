const express = require('express');
const playerCtl = require('../controllers/players');
const cashfreeCtl = require('../controllers/paymentsCashfree');

const Player = require('../models/Player');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
//router.use(protect);
//router.use(authorize('admin','Player'));
router.get('/winnerfeed', playerCtl.getWinnerfeed);
router.post('/sendAppUrl', playerCtl.sendAppUrl);

router.get('/versionlist', playerCtl.getVersion);

router.post('/saveleaderboard', protect, playerCtl.saveLeaderBoard);
router.post('/membership', protect, playerCtl.membership);

router.get('/tournaments', protect, playerCtl.getTournaments);
router.get('/banners', protect, playerCtl.getBanners);
router.post('/refer', protect, playerCtl.updateRefer);

router.post('/status/:id', protect, playerCtl.updateStatus);

router.get('/page', protect, playerCtl.getPage);

router.route('/profile').get(protect, playerCtl.getPlayer);
//.post(protect, playerCtl.updatePlayer);
router.route('/profile/image').post(protect, playerCtl.updatePlayerImage);
router.post('/notification/clearall', protect, playerCtl.clearAllNotification);
router.get('/notification', protect, playerCtl.getNotication);
router.post('/poll', protect, playerCtl.poll);
router.get('/pollList', protect, playerCtl.pollList);
router.post('/pin', protect, playerCtl.setPin);
router.post('/checkpin', playerCtl.chkPin);
router.post('/savefbtoken', protect, playerCtl.savefbtoken);
// router.post('/game/join', protect, join);
// router.post('/game/won', protect, won);
router.post('/ticket/add', protect, playerCtl.ticketAdd);
router.post('/ticket/reply', protect, playerCtl.ticketReply);
router.get('/ticket/', protect, playerCtl.ticketList);
router.post('/withdraw/request', protect, playerCtl.withDrawRequest);
router.post('/debit', protect, playerCtl.debiteAmount);
router.post('/credit/', protect, playerCtl.creditAmount);
router.post('/debitBonus/', protect, playerCtl.debitBonus);
router.post('/creditBonus/', protect, playerCtl.creditBonus);


router.post('/addMoney/', protect, playerCtl.addMoney);
router.get('/info', protect, playerCtl.playerInfo);
router.route('/online').get(protect, playerCtl.getOnlinePlayers).post(playerCtl.editOnlinePlayers);
router.route('/').post(protect, playerCtl.getPlayers);

router.route('/bank').post(protect, playerCtl.addBank);
router.route('/upi').post(protect, playerCtl.addUpi);
router.route('/wallet').post(protect, playerCtl.addWallet);
router.route('/lobbys').get(protect, playerCtl.getLobbys);
router.route('/couponlist/:type').get(protect, playerCtl.getCoupons);
router.route('/giftlist').get(playerCtl.getGifts);
router.route('/deleteplayerdata/:id').delete(protect, playerCtl.deletePlayerData);
router.route('/deleteplayerdata-byids').post(protect, playerCtl.deletePlayerDataBIds);
router
  .route('/:id')
  .get(protect, playerCtl.getPlayer)
  .post(protect, playerCtl.updatePlayer)
  .delete(protect, playerCtl.deletePlayer);

module.exports = router;
