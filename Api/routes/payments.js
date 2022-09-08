const express = require('express');
const {

    createSetting,
    getSetting,
    getSettings,
    updateSetting,
    deleteSetting

} = require('../controllers/settings');
const paymentCashfreeCtrl = require('../controllers/paymentsCashfree');

const router = express.Router({ mergeParams: true });

const { advancedResults, ownResults, defaultResults } = require('../middleware/advancedResults');
const { protect, authorize, init } = require('../middleware/auth');
const Setting = require('../models/Setting');
//router.use(protect);
//router.route('/cashfree/upiverify').post(protect, paymentCashfreeCtrl.upiValidate);

router.route('/add').post(protect, createSetting);
router.route('/').post(protect, getSettings);
router.route('/cashfree/token').post(protect, paymentCashfreeCtrl.getToken);
router.route('/cashfree/payout').post(protect, paymentCashfreeCtrl.payout);
router.route('/cashfree/key').post(protect, paymentCashfreeCtrl.getKey);
router.route('/cashfree/notify').post(paymentCashfreeCtrl.handleNotify);

router
    .route('/:id')
    .get(protect, getSetting)
    .post(protect, updateSetting)
    .delete(protect, deleteSetting);

module.exports = router;
