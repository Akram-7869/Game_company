const express = require('express');
const multer = require("multer");

const  palyerCtrl = require('../controllers/Players');

const {dashBoardView} = require('../controllers/Dashboard');
const  transactionCotroller = require('../controllers/TransactionController');
const bannerControler = require('../controllers/BannerController');
const settingCtrl = require('../controllers/SettingController');
const managerCtrl = require('../controllers/ManagerController');
const botCtrl = require('../controllers/BotController');
const versionCtrl = require('../controllers/VersionController');

const { protect } = require('../middleware/auth');
const router = express.Router({ mergeParams: true });
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/files/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

//var upload = multer({ storage: storage })
router.use(protect);

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

router.route('/setting').get(settingCtrl.settingList); router.route('/setting/data').post(settingCtrl.getSettings);
//router.route('/banner/view/:id').get(  showBannerView);
router.route('/setting/add').get(settingCtrl.settingAdd).post(settingCtrl.createSettings);
router.route('/setting/:id').get(settingCtrl.getSetting).post(settingCtrl.updateSetting).delete(settingCtrl.deleteSetting);


//router.route('/banner/view/:id').get(  showBannerView);
router.route('/banner/add').get(bannerControler.bannerAdd)
      .post(bannerControler.createBanners);
router.route('/banner/data').post(bannerControler.getBanners);
router.route('/banner').get(bannerControler.bannerList);
router.route('/banner/:id').get(bannerControler.getBanner).post(bannerControler.updateBanner).delete(bannerControler.deleteBanner);


//router.route('/transaction/view/:id').get(transactionView);
router.route('/transaction/data').post(transactionCotroller.getTranscations);
router.route('/transaction').get(transactionCotroller.transcationList);


router.route('/dashboard').get(dashBoardView);

router.route('/player/upi/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/wallet/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/bank/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/profile/:id').get(palyerCtrl.getProfile).post(palyerCtrl.updateProfile);
router.route('/player/status/:id').post(palyerCtrl.updatePlayerStatus);
router.route('/player/view/:id').get(palyerCtrl.showPlayerView);

router.route('/player/add').get(palyerCtrl.getAddForm).post(palyerCtrl.createPlayers);
router.route('/player/data').post(palyerCtrl.getPlayerList);


router.route('/player').get(palyerCtrl.getPlayers);
router.route('/player/:id').get(palyerCtrl.getPlayer).post(palyerCtrl.updatePlayer).delete(palyerCtrl.deletePlayer);

module.exports = router;
