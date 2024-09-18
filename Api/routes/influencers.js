const express = require('express');
const userCtrl = require('../controllers/influencers');

const User = require('../models/Influencer');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
//router.use(authorize('admin', 'superadmin'));
router.route('/withdraw').post(userCtrl.withDrawRequest);
router.route('/bank').post(userCtrl.addBank);
router.route('/upi').post(userCtrl.addUpi);

router.route('/resetpassword').post(userCtrl.resetPassword);
router.route('/add').post(userCtrl.createUser);
router.route('/').post(userCtrl.getUsers);


router
  .route('/:id')
  .get(userCtrl.getUser)
  .put(userCtrl.updateUser)
  .delete(userCtrl.deleteUser);

module.exports = router;
