const express = require('express');

const palyerCtrl = require('../controllers/Players');

const dashCtl = require('../controllers/Dashboard');
const transactionCotroller = require('../controllers/TransactionController');
const bannerControler = require('../controllers/BannerController');
const settingCtrl = require('../controllers/SettingController');
const managerCtrl = require('../controllers/ManagerController');
const botCtrl = require('../controllers/BotController');
const ticketCtrl = require('../controllers/TicketController');
const versionCtrl = require('../controllers/VersionController');
const tournamentCtrl = require('../controllers/TurnamentController');
const notificationCtrl = require('../controllers/NotificationController');
const couponCtrl = require('../controllers/CouponController');
const bannerTextCtrl = require('../controllers/BannerTextController');
const postCtrl = require('../controllers/PostController');


const pollCtrl = require('../controllers/PollController');
const gameMangCtrl = require('../controllers/GameManagerController');


const { protect } = require('../middleware/auth');
const router = express.Router({ mergeParams: true });


//var upload = multer({ storage: storage })
router.use(protect);

router.route('/posts').get(postCtrl.postList); 
router.route('/posts/data').post(postCtrl.getPosts);
router.route('/posts/add').get(postCtrl.getPost).post(postCtrl.postAdd);
router.route('/posts/:id').get(postCtrl.editPost).post(postCtrl.updatePost).delete(postCtrl.deletePost);


router.route('/bannertext').get(bannerTextCtrl.listBannertext); 
router.route('/bannertext/data').post(bannerTextCtrl.getBannertexts);
router.route('/bannertext/add').get(bannerTextCtrl.addBannertext).post(bannerTextCtrl.createBannertexts);
router.route('/bannertext/:id').get(bannerTextCtrl.getBannertext).post(bannerTextCtrl.updateBannertext).delete(bannerTextCtrl.deleteBannertext);

router.route('/poll/add').get(pollCtrl.pollAdd)
      .post(pollCtrl.createPolls);
router.route('/poll/data').post(pollCtrl.getPolls);
router.route('/poll').get(pollCtrl.pollList);
router.route('/poll/:id').get(pollCtrl.editPoll).post(pollCtrl.updatePoll).delete(pollCtrl.deletePoll);

//setting
router.route('/setting/logo').get(settingCtrl.getSitelogo).post(settingCtrl.updateSitelogo);

router.route('/site').get(settingCtrl.siteList); router.route('/site/data').post(settingCtrl.getSiteList);
router.route('/site/add').get(settingCtrl.addSite).post(settingCtrl.createSite);
router.route('/site/:id').get(settingCtrl.getSite).post(settingCtrl.updateSite).delete(settingCtrl.deleteSite);
router.route('/site/:field/:id').post(settingCtrl.updateSiteField);



router.route('/smsgateway').get(settingCtrl.smsgatewayList); router.route('/smsgateway/data').post(settingCtrl.getSmsGatewayList);
router.route('/smsgateway/add').get(settingCtrl.addSmsGateway).post(settingCtrl.createSmsGateway);
router.route('/smsgateway/:id').get(settingCtrl.getSmsGateway).post(settingCtrl.updateSmsGateway).delete(settingCtrl.deleteSmsGateway);


router.route('/payment').get(settingCtrl.paymentList); router.route('/payment/data').post(settingCtrl.getPaymentList);
router.route('/payment/add').get(settingCtrl.addPayment).post(settingCtrl.createPayment);
router.route('/payment/:id').get(settingCtrl.getPayment).post(settingCtrl.updatePayment).delete(settingCtrl.deletePayment);

router.route('/paymentmethod').get(settingCtrl.paymentMethodList); router.route('/paymentmethod/data').post(settingCtrl.getPaymentMethod);
router.route('/paymentmethod/add').get(settingCtrl.addPaymentMethod).post(settingCtrl.createPaymentMethod);
router.route('/paymentmethod/:id').get(settingCtrl.getPaymentMethod).post(settingCtrl.updatePayment).delete(settingCtrl.deletePaymentMethod);

router.route('/page').get(settingCtrl.pageList); router.route('/page/data').post(settingCtrl.getPageList);
router.route('/page/add').get(settingCtrl.pageAdd).post(settingCtrl.createPage);
router.route('/page/:id').get(settingCtrl.getPage).post(settingCtrl.updatePage).delete(settingCtrl.deletePage);

router.route('/ticket/delete-byids').delete(ticketCtrl.deleteTicketBbIds);
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

router.route('/tournament').get(tournamentCtrl.listTournament); router.route('/tournament/data').post(tournamentCtrl.getTournaments);
router.route('/tournament/add').get(tournamentCtrl.addTournament).post(tournamentCtrl.createTournaments);
router.route('/tournament/:id').get(tournamentCtrl.getTournament).post(tournamentCtrl.updateTournament).delete(tournamentCtrl.deleteTournament);

router.route('/coupon').get(couponCtrl.listCoupon); router.route('/coupon/data').post(couponCtrl.getCoupons);
router.route('/coupon/add').get(couponCtrl.addCoupon).post(couponCtrl.createCoupons);
router.route('/coupon/:id').get(couponCtrl.getCoupon).post(couponCtrl.updateCoupon).delete(couponCtrl.deleteCoupon);



router.route('/manager').get(managerCtrl.listManager); router.route('/manager/data').post(managerCtrl.getManagers);
//router.route('/manager/view/:id').get(  showManagerView);
router.route('/manager/restpassword').get(managerCtrl.resetPassword).post(managerCtrl.updatePassword);
router.route('/manager/add').get(managerCtrl.addManager).post(managerCtrl.createManagers);
router.route('/manager/:id').get(managerCtrl.getManager).post(managerCtrl.updateManager).delete(managerCtrl.deleteManager);

router.route('/notification/player/:nid/:id').post(notificationCtrl.addPlayerList).delete(notificationCtrl.removePlayerList);
router.route('/notification/all/:id').get(notificationCtrl.sentoAll);
router.route('/notification/player/:id').get(notificationCtrl.getPlayerList);
router.route('/notification').get(notificationCtrl.notificationList); router.route('/notification/data').post(notificationCtrl.getNotifications);
router.route('/notification/add').get(notificationCtrl.notificationAdd).post(notificationCtrl.createNotifications);
//ui
router.route('/notification/:id').get(notificationCtrl.getNotification).post(notificationCtrl.updateNotification).delete(notificationCtrl.deleteNotification);


//router.route('/notification').get(palyerCtrl.getPlayerNotification);
router.route('/gamemanager/add').get(gameMangCtrl.gameAdd).post(gameMangCtrl.gameCreate);
router.route('/gamemanager/upload/:id').post(gameMangCtrl.updatePackage);

router.route('/gamemanager/data').post(gameMangCtrl.getgamedata);
router.route('/gamemanager').get(gameMangCtrl.gameList);

router.route('/gamemanager/:id').get(gameMangCtrl.editgame).post(gameMangCtrl.updategame).delete(gameMangCtrl.delgame);


router.route('/banner/add').get(bannerControler.bannerAdd)
      .post(bannerControler.createBanners);
router.route('/banner/data').post(bannerControler.getBanners);
router.route('/banner').get(bannerControler.bannerList);
router.route('/banner/:id').get(bannerControler.editBanner).post(bannerControler.updateBanner).delete(bannerControler.deleteBanner);

router.route('/wallet/player/:id').post(transactionCotroller.createTransaction);
//router.route('/transaction/view/:id').get(transactionView);
router.route('/transaction/data').post(transactionCotroller.getTranscations);
router.route('/transaction/:id').get(transactionCotroller.getTransaction).post(transactionCotroller.updateTransaction).delete(transactionCotroller.deleteTransaction);

router.route('/transaction').get(transactionCotroller.transcationList);
router.route('/wallet').get(palyerCtrl.getPlayerWallet);
router.route('/payout/approve/:id').post(palyerCtrl.playerPayoutApprove);
//router.route('/payout/edit/decline/:id').get(palyerCtrl.playerPayoutDecline);
router.route('/payout/edit/:id').get(palyerCtrl.getPlayerPayoutEdit).post(palyerCtrl.postPlayerPayoutEdit);
router.route('/payout').get(palyerCtrl.getPlayerPayout);

router.route('/chat').get(palyerCtrl.getChatList);
router.route('/report/player').get(palyerCtrl.getPlayerReport);
router.route('/report/payment').get(palyerCtrl.getPaymentReport);
router.route('/report/tds').get(palyerCtrl.tdsReport);
router.route('/report/tds-download').get(palyerCtrl.tdsReportDownload);
router.route('/report/admincommission').get(palyerCtrl.adminCommissionReport);
router.route('/report/admincommission-download').get(palyerCtrl.adminCommissionDownload);
router.route('/report/gst').get(palyerCtrl.gstReport);
router.route('/report/gst-download').get(palyerCtrl.gstReportDownload);

router.route('/leaderboard').get(palyerCtrl.getLeaderBoard);
router.route('/game/data').post(palyerCtrl.getLeaderBoardList);
router.route('/playerhistory/:id').get(palyerCtrl.getPlayerHistory);

router.route('/dashboard').get(dashCtl.dashBoardView);
router.route('/dashboard/total-income').post(dashCtl.totalIncome);
router.route('/chart/data').post(dashCtl.getChartData);

router.route('/playerold').get(palyerCtrl.playerOld);
router.route('/playerold/data').post(palyerCtrl.getPlayerOldList);
router.route('/playerdelold/:id').delete(palyerCtrl.deleteOldPlayerData);

router.route('/player/upi/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/wallet/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/bank/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/profile/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/status/:id').post(palyerCtrl.updatePlayerStatus);
router.route('/player/view/:id').get(palyerCtrl.showPlayerView);
router.route('/player/credit/:id').post(palyerCtrl.creditPlayer);



router.route('/player/add').get(palyerCtrl.getAddForm).post(palyerCtrl.createPlayers);
router.route('/player/data').post(palyerCtrl.getPlayerList);

router.route('/player/delete-data/:id').delete(palyerCtrl.deletePlayerData);
router.route('/player/delete-byids').delete(palyerCtrl.deletePlayerDataByIds);
router.route('/player/membership').get(palyerCtrl.getPlayerMembership);
router.route('/player/kyc').get(palyerCtrl.getPlayerKyc);
router.route('/player/banned').get(palyerCtrl.getPlayerBanned);
router.route('/player').get(palyerCtrl.getPlayers);
router.route('/player/:id').get(palyerCtrl.getPlayer).post(palyerCtrl.updatePlayer).delete(palyerCtrl.deletePlayer);

module.exports = router;
