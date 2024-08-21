const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const comisionCtl = require('../controllers/CommissionController');
const tranCtl = require('../controllers/TransactionController');




router.use(protect);

// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardView);
router.route('/commison').get(comisionCtl.frenchiseCommList);
router.route('/commison/data').post(comisionCtl.frenchiseCommData);

router.route('/transactions').get(tranCtl.transcationList);
router.route('/transactions/data').post(tranCtl.getTranscations);
module.exports = router;
