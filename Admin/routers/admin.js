const express = require('express');
const {
    createPlayers, getPlayers,  getPlayer,
    updatePlayer,deletePlayer,
    getPlayerList,getAddForm,
    showPlayerView,
    getProfile, updateProfile
} = require('../controllers/Players');

const {
  dashBoardView
} = require('../controllers/Dashboard');
const {
  getTranscations,transcationList 
} = require('../controllers/TransactionController');
const {
 getBanners,getBanner,updateBanner,deleteBanner, bannerList,bannerAdd,createBanners
} = require('../controllers/BannerController');
const {
  getSettings,getSetting,updateSetting,deleteSetting, settingList,settingAdd,createSettings
 } = require('../controllers/SettingController');
//const { defaultResults } = require('../middleware/advancedResults');
//const { protect, authorize, init } = require('../middleware/auth');
const router = express.Router({ mergeParams: true });

router.route('/settings').get(settingList); router.route('/settings/data').post(getSettings);
//router.route('/banner/view/:id').get(  showBannerView);
router.route('/settings/add').get(settingAdd).post(createSettings);

router.route('/settings/:id').get(getSetting).post(updateSetting).delete( deleteSetting);



//router.route('/banner/view/:id').get(  showBannerView);
router.route('/banner/add').get(bannerAdd).post(createBanners);
router.route('/banner/data').post(getBanners);


router.route('/banner').get(bannerList);
router.route('/banner/:id').get(getBanner).post(updateBanner).delete( deleteBanner);


//router.route('/transaction/view/:id').get(transactionView);
router.route('/transaction/data').get(getTranscations);
router.route('/transaction').get(transcationList);



router.route('/dashboard').get(dashBoardView);

router.route('/player/upi/:id').get(getProfile).post(updateProfile);
router.route('/player/wallet/:id').get(getProfile).post(updateProfile);
router.route('/player/bank/:id').get(getProfile).post(updateProfile);
router.route('/player/profile/:id').get(getProfile).post(updateProfile);
router.route('/player/view/:id').get(showPlayerView);
router.route('/player/add').get(getAddForm).post(createPlayers);
router.route('/player/data').post(getPlayerList);


router.route('/player').get(getPlayers);
router.route('/player/:id').get(getPlayer).post(updatePlayer).delete( deletePlayer);

module.exports = router;
