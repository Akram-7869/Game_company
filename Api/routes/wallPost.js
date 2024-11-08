const express = require('express');
const wallPostCtrl = require('../controllers/WallPost');


const router = express.Router({ mergeParams: true });
//const { protect} = require('../middleware/auth');

//router.use(protect);
router.route('/image/:id').get(wallPostCtrl.getFile);
router.route('/uploadfile').post(wallPostCtrl.uploadFile);
router.route('/add').post(wallPostCtrl.createWallpost);
router.route('/').post(wallPostCtrl.getWallposts);

router
    .route('/:id')
    .get(wallPostCtrl.getWallpost)
    .post(wallPostCtrl.updateWallpost)
    .delete(wallPostCtrl.deleteWallpost);

module.exports = router;
