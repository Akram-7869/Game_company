const express = require('express');
const dash = require('../controllers/dashboards');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/filter/dashboard').post(dash.getFilterDashboard);
 router.route('/filter/influencer').post(dash.getInfluencerDashboard);
 router.route('/filter/franchise').post(dash.getFranchiseDashboard);


router.route('/chart/data').post(dash.getGraphData);
router.route('/total-income').post(dash.totalIncome);
router.route('/influencer-income').post(dash.influencerIncome);
router.route('/franchise-income').post(dash.influencerIncome);


router.route('/add').post(dash.createDashboard);
router.route('/').post(dash.getDashboards);

router
  .route('/:id')
  .get(dash.getDashboard)
  .post(dash.updateDashboard)
  .delete(dash.deleteDashboard);

module.exports = router;
