const express = require('express');
const {

    createSetting,
    getSetting,
    getSettings,
    updateSetting,
    deleteSetting,
    getSettingByName,
    uploadeImage,
    getFile,
    setCommission, getSitedata,setUpi,setBank

} = require('../controllers/settings');


const router = express.Router({ mergeParams: true });

const { advancedResults, ownResults, defaultResults } = require('../middleware/advancedResults');
const { protect, authorize, init } = require('../middleware/auth');
const Setting = require('../models/Setting');
//router.use(protect);
router.route('/upload/:id').post(uploadeImage);

//router.route('/image/:id').get(getFile);


router.route('/add').post(protect, createSetting);
router.route('/filter/SITE').get(getSitedata);
router.route('/filter/:type/:name').get(getSettingByName);
router.route('/filter/:type').post(protect, getSettings);
router.route('/commission/:id').post(protect, setCommission);
router.route('/upi/:id').post(protect, setUpi);
router.route('/bank/:id').post(protect, setBank);
router.route('/games/:id').post(protect, setGame);

router
    .route('/:id')
    .get(protect, getSetting)
    .post(protect, updateSetting)
    .delete(protect, deleteSetting);

module.exports = router;
