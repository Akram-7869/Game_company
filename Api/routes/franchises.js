const express = require('express');
const franchiseCtrl = require('../controllers/franchises');

 
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
//router.use(authorize('admin', 'superadmin'));


router.route('/resetpassword').post(franchiseCtrl.resetPassword);
router.route('/add').post(franchiseCtrl.createFranchise);
router.route('/').post(franchiseCtrl.getFranchises);


router
  .route('/:id')
  .get(franchiseCtrl.getFranchise)
  .put(franchiseCtrl.updateFranchise)
  .delete(franchiseCtrl.deleteFranchise);

module.exports = router;
