const express = require('express');
const {

    createBanner,
    getBanner,
    getBanners,
    updateBanner,
    deleteBanner,uploadFile,getFile

} = require('../controllers/banners');


const router = express.Router({ mergeParams: true });
//const { protect} = require('../middleware/auth');
 
//router.use(protect);
router.route('/image/:id').get(getFile);
router.route('/uploadfile').post(uploadFile);
router.route('/add').post(createBanner);
router.route('/').post(getBanners);

router
    .route('/:id')
    .get(getBanner)
    .post( updateBanner)
    .delete( deleteBanner);

module.exports = router;
