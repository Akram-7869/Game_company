const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const commissionCtl = require('../controllers/CommissionController');
const tranCtl = require('../controllers/TransactionController');
const franchiseCtl = require('../controllers/FranchiseController');
const {authorize} = require('../middleware/auth');




router.use(protect,authorize('franchise'));

router.route('/profile').get(franchiseCtl.profile).post(franchiseCtl.updatefranchise);
router.route('/withdraw').get(franchiseCtl.withdraw);

router.route('/withdraw').post(franchiseCtl.postwithdraw);
router.route('/bank').post(franchiseCtl.addBank);

router.route('/upi').post(franchiseCtl.addUpi);
router.route('/usdt').post(franchiseCtl.addUsdt);


router.route('/restpassword').get(franchiseCtl.resetPassword);
router.route('/restpassword').post(franchiseCtl.updatePassword);


// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardfranchiseView);
router.route('/dashboard/income').post(dashCtl.franchiseIncome);

router.route('/commission').get(commissionCtl.franchiseCommList);
router.route('/commission/data').post(commissionCtl.franchiseCommData);

router.route('/transactions').get(tranCtl.franchiseList);
router.route('/transaction/data').post(tranCtl.getTranscations);
module.exports = router;
