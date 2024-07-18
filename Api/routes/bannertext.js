const express = require('express');
const bannertextCtrl = require('../controllers/bannertext');


const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

// router.use(protect);

router.route('/add').post(bannertextCtrl.createBannertext);
router.route('/').post(bannertextCtrl.getBannertexts);
router.route('/list').get(bannertextCtrl.getBannertextList);

router
    .route('/:id')
    .get(protect, bannertextCtrl.getBannertext)
    .post(bannertextCtrl.updateBannertext)
    .delete(protect, bannertextCtrl.deleteBannertext);

module.exports = router;
