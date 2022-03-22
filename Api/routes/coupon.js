const express = require('express');
const couponCtrl = require('../controllers/coupon');


const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

// router.use(protect);

router.route('/add').post(couponCtrl.createCoupon);
router.route('/').post(couponCtrl.getCoupons);

router
    .route('/:id')
    .get(protect, couponCtrl.getCoupon)
    .post(couponCtrl.updateCoupon)
    .delete(protect, couponCtrl.deleteCoupon);

module.exports = router;
