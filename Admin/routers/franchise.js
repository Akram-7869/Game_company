const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const commissionCtl = require('../controllers/CommissionController');
const tranCtl = require('../controllers/TransactionController');
const {authorize} = require('../middleware/auth');




router.use(protect,authorize('franchise'));

// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardfranchiseView);
router.route('/dashboard/income').post(dashCtl.franchiseIncome);

router.route('/commission').get(commissionCtl.franchiseCommList);
router.route('/commission/data').post(commissionCtl.franchiseCommData);

router.route('/transactions').get(tranCtl.franchiseList);
router.route('/transaction/data').post(tranCtl.getTranscations);
module.exports = router;
