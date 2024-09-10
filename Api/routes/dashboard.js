const express = require('express');
const dash = require('../controllers/dashboards');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

//router.use(protect);
router.route('/dalykamision').post(dash.calculateDailyCommissions);
router.route('/filter/dashboard').post(protect, dash.getFilterDashboard);
 router.route('/filter/influencer').post(protect, dash.getInfluencerDashboard);
 router.route('/filter/franchise').post(protect, dash.getFranchiseDashboard);


router.route('/chart/data').post(protect,dash.getGraphData);
router.route('/total-income').post(protect, dash.totalIncome);
router.route('/influencer-income').post(protect, dash.influencerIncome);
router.route('/franchise-income').post(protect, dash.franchiseIncome);

router.route('/add').post(protect, dash.createDashboard);
router.route('/').post(protect, dash.getDashboards);

router
  .route('/:id')
  .get(protect, dash.getDashboard)
  .post(protect, dash.updateDashboard)
  .delete(protect, dash.deleteDashboard);

module.exports = router;
