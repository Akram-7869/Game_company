const express = require('express');
const playerCtl = require('../controllers/players');
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
//router.use(protect);
//router.use(authorize('admin','Player'));
router.get('/commission', playerCtl.creditReferalComission);
router.get('/winnerfeed', playerCtl.getWinnerfeed);
router.get('/winnertop/:id', playerCtl.getWinnertop);
router.post('/sendAppUrl', playerCtl.sendAppUrl);

router.get('/versionlist', playerCtl.getVersion);
router.get('/myrefrer', protect, playerCtl.getReferList);

router.post('/saveleaderboard', protect, playerCtl.saveLeaderBoard);

router.get('/tournaments', protect, playerCtl.getTournaments);
router.get('/banners', protect, playerCtl.getBanners);
router.post('/refer', protect, playerCtl.updateRefer);

router.post('/status/:id', protect, playerCtl.updateStatus);

router.get('/page', protect, playerCtl.getPage);

router.post('/playerold', protect, playerCtl.playerold);
router.post('/playerold', protect, playerCtl.playerold);
router.route('/profile').get(protect, playerCtl.getPlayer).post(protect, playerCtl.updateProfile);
router.route('/sendotp').post(protect, playerCtl.sendotp);
router.post('/notification/clearall', protect, playerCtl.clearAllNotification);
//router.get('/notification', protect, playerCtl.getNotication);
router.post('/poll', protect, playerCtl.poll);
router.get('/pollList', protect, playerCtl.pollList);
router.post('/checkupi', protect, playerCtl.checkUpi);
router.post('/savefbtoken', protect, playerCtl.savefbtoken);

router.post('/withdraw/request', protect, playerCtl.withDrawRequest);
router.post('/debit', protect, playerCtl.debiteAmount);
router.post('/credit/', protect, playerCtl.creditAmount);
router.post('/reverse/', protect, playerCtl.reverseAmount);
router.post('/gamestatus/', protect, playerCtl.gameStatus);

router.post('/debitBonus/', protect, playerCtl.debitBonus);
router.post('/creditBonus/', protect, playerCtl.creditBonus);


router.post('/addMoney/', protect, playerCtl.addMoney);
router.route('/').post(protect, playerCtl.getPlayers);

router.route('/bank').post(protect, playerCtl.addBank);
router.route('/upi').post(protect, playerCtl.addUpi);
router.route('/wallet').post(protect, playerCtl.addWallet);
router.route('/couponlist/:type').get(protect, playerCtl.getCoupons);
router.route('/giftlist').get(playerCtl.getGifts);
router.route('/deleteplayerdata/:id').delete(protect, playerCtl.deletePlayerData);
router.route('/deloldplayer/:id').delete(protect, playerCtl.deloldplayer);
router.route('/deleteplayerdata-byids').post(protect, playerCtl.deletePlayerDataBIds);
router
  .route('/:id')
  .get(protect, playerCtl.getPlayer)
  .post(protect, playerCtl.updatePlayer)
  .delete(protect, playerCtl.deletePlayer);

module.exports = router;
//router.route('/profile/image').post(protect, playerCtl.updatePlayerImage);
//router.post('/pin', protect, playerCtl.setPin);
//router.post('/checkpin', playerCtl.chkPin);
// router.post('/game/join', protect, join);
router.post('/game/won', protect, playerCtl.won);
//router.post('/ticket/add', protect, playerCtl.ticketAdd);
//router.post('/ticket/reply', protect, playerCtl.ticketReply);
//router.get('/ticket/', protect, playerCtl.ticketList);
//router.get('/info', protect, playerCtl.playerInfo);
//router.route('/lobbys').get(protect, playerCtl.getLobbys);
//router.post('/membership', protect, playerCtl.membership);


