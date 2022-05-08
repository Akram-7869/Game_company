const express = require('express');
const userCtrl = require('../controllers/users');

const User = require('../models/User');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
//router.use(authorize('admin', 'superadmin'));
router.route('/resetpassword').post(userCtrl.resetPassword);
router.route('/add').post(userCtrl.createUser);
router.route('/').post(userCtrl.getUsers);


router
  .route('/:id')
  .get(userCtrl.getUser)
  .put(userCtrl.updateUser)
  .delete(userCtrl.deleteUser);

module.exports = router;
