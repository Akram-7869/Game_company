const express = require('express');
const frenchiseCtrl = require('../controllers/frenchises');

 
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
//router.use(authorize('admin', 'superadmin'));
router.route('/resetpassword').post(frenchiseCtrl.resetPassword);
router.route('/add').post(frenchiseCtrl.createFranchise);
router.route('/').post(frenchiseCtrl.getFranchises);


router
  .route('/:id')
  .get(frenchiseCtrl.getFranchise)
  .put(frenchiseCtrl.updateFranchise)
  .delete(frenchiseCtrl.deleteFranchise);

module.exports = router;
