const express = require('express');
 
const  palyerCtrl = require('../controllers/Players');

const {dashBoardView} = require('../controllers/Dashboard');
const  transactionCotroller = require('../controllers/TransactionController');
const bannerControler = require('../controllers/BannerController');
const settingCtrl = require('../controllers/SettingController');
const managerCtrl = require('../controllers/ManagerController');
const botCtrl = require('../controllers/BotController');
const ticketCtrl = require('../controllers/TicketController');
const versionCtrl = require('../controllers/VersionController');
const notificationCtrl = require('../controllers/NotificationController');

const { protect } = require('../middleware/auth');
const router = express.Router({ mergeParams: true });
 

//var upload = multer({ storage: storage })
router.use(protect);

//setting
 router.route('/setting/logo').get(settingCtrl.getSitelogo).post(settingCtrl.updateSitelogo);
 
router.route('/site').get(settingCtrl.siteList); router.route('/site/data').post(settingCtrl.getSiteList);
router.route('/site/add').get(settingCtrl.addSite).post(settingCtrl.createSite);
 router.route('/site/:id').get(settingCtrl.getSite).post(settingCtrl.updateSite).delete(settingCtrl.deleteSite);



router.route('/smsgateway').get(settingCtrl.smsgatewayList); router.route('/smsgateway/data').post(settingCtrl.getSmsGatewayList);
router.route('/smsgateway/add').get(settingCtrl.addSmsGateway).post(settingCtrl.createSmsGateway);
router.route('/smsgateway/:id').get(settingCtrl.getSmsGateway).post(settingCtrl.updateSmsGateway).delete(settingCtrl.deleteSmsGateway);


router.route('/payment').get(settingCtrl.paymentList); router.route('/payment/data').post(settingCtrl.getPaymentList);
router.route('/payment/add').get(settingCtrl.addPayment).post(settingCtrl.createPayment);
router.route('/payment/:id').get(settingCtrl.getPayment).post(settingCtrl.updatePayment).delete(settingCtrl.deletePayment);

router.route('/page').get(settingCtrl.pageList); router.route('/page/data').post(settingCtrl.getPageList);
 router.route('/page/add').get(settingCtrl.pageAdd).post(settingCtrl.createPage);
router.route('/page/:id').get(settingCtrl.getPage).post(settingCtrl.updatePage).delete(settingCtrl.deletePage);

router.route('/ticket').get(ticketCtrl.listTicket); router.route('/ticket/data').post(ticketCtrl.getTickets);
router.route('/ticket/add').get(ticketCtrl.addTicket).post(ticketCtrl.createTickets);
router.route('/ticket/:id').get(ticketCtrl.getTicket).post(ticketCtrl.updateTicket).delete(ticketCtrl.deleteTicket);


 router.route('/bot').get(botCtrl.listBot); router.route('/bot/data').post(botCtrl.getBots);
 //router.route('/banner/view/:id').get(  showBannerView);
 router.route('/bot/add').get(botCtrl.addBot).post(botCtrl.createBots);
 router.route('/bot/:id').get(botCtrl.getBot).post(botCtrl.updateBot).delete(botCtrl.deleteBot);

 router.route('/version').get(versionCtrl.listVersion); router.route('/version/data').post(versionCtrl.getVersions);
 //router.route('/banner/view/:id').get(  showBannerView);
 router.route('/version/add').get(versionCtrl.addVersion).post(versionCtrl.createVersions);
 router.route('/version/:id').get(versionCtrl.getVersion).post(versionCtrl.updateVersion).delete(versionCtrl.deleteVersion);




router.route('/manager').get(managerCtrl.listManager); router.route('/manager/data').post(managerCtrl.getManagers);
//router.route('/manager/view/:id').get(  showManagerView);
 router.route('/manager/add').get(managerCtrl.addManager).post(managerCtrl.createManagers);
 router.route('/manager/:id').get(managerCtrl.getManager).post(managerCtrl.updateManager).delete(managerCtrl.deleteManager);

 router.route('/notification/player/:nid/:id').post(notificationCtrl.addPlayerList).delete(notificationCtrl.removePlayerList);
router.route('/notification/player/:id').get(notificationCtrl.getPlayerList);
router.route('/notification').get(notificationCtrl.notificationList); router.route('/notification/data').post(notificationCtrl.getNotifications);
router.route('/notification/add').get(notificationCtrl.notificationAdd).post(notificationCtrl.createNotifications);
//ui
router.route('/notification/:id').get(notificationCtrl.getNotification).post(notificationCtrl.updateNotification).delete(notificationCtrl.deleteNotification);


//router.route('/notification').get(palyerCtrl.getPlayerNotification);

 
router.route('/banner/add').get(bannerControler.bannerAdd)
      .post(bannerControler.createBanners);
router.route('/banner/data').post(bannerControler.getBanners);
router.route('/banner').get(bannerControler.bannerList);
router.route('/banner/:id').get(bannerControler.editBanner).post(bannerControler.updateBanner).delete(bannerControler.deleteBanner);


//router.route('/transaction/view/:id').get(transactionView);
router.route('/transaction/data').post(transactionCotroller.getTranscations);
router.route('/transaction').get(transactionCotroller.transcationList);
router.route('/wallet').get(palyerCtrl.getPlayerWallet);
router.route('/payout').get(palyerCtrl.getPlayerPayout);

router.route('/chat').get(palyerCtrl.getChatList);
router.route('/report/player').get(palyerCtrl.getPlayerReport);
router.route('/report/payment').get(palyerCtrl.getPaymentReport);
router.route('/leaderboard').get(palyerCtrl.getLeaderBoard);
router.route('/playerhistory').get(palyerCtrl.getPlayerHistory);

router.route('/dashboard').get(dashBoardView);

router.route('/player/upi/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/wallet/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/bank/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/profile/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/status/:id').post(palyerCtrl.updatePlayerStatus);
router.route('/player/view/:id').get(palyerCtrl.showPlayerView);
router.route('/player/credit/:id').post(palyerCtrl.creditPlayer);



router.route('/player/add').get(palyerCtrl.getAddForm).post(palyerCtrl.createPlayers);
router.route('/player/data').post(palyerCtrl.getPlayerList);

router.route('/player/deleted').get(palyerCtrl.getPlayers);
router.route('/player/kyc').get(palyerCtrl.getPlayerKyc);
router.route('/player/banned').get(palyerCtrl.getPlayerBanned);
router.route('/player').get(palyerCtrl.getPlayers);
router.route('/player/:id').get(palyerCtrl.getPlayer).post(palyerCtrl.updatePlayer).delete(palyerCtrl.deletePlayer);

module.exports = router;
