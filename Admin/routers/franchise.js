const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const commissionCtl = require('../controllers/CommissionController');
const tranCtl = require('../controllers/TransactionController');




router.use(protect);

// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardView);
router.route('/dashboard/income').get(dashCtl.franchiseIncome);

router.route('/commission').get(commissionCtl.influencerCommList);
router.route('/commission/data').post(commissionCtl.influencerCommData);

router.route('/transactions').get(tranCtl.transcationList);
router.route('/transactions/data').post(tranCtl.getTranscations);
module.exports = router;
