const express = require('express');
const dash = require('../controllers/dashboards');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/filter/:type').post(dash.getFilterDashboard);
router.route('/chart/data').post(dash.getGraphData);
router.route('/total-income').get(dash.totalIncome);
router.route('/add').post(dash.createDashboard);
router.route('/').post(dash.getDashboards);

router
  .route('/:id')
  .get(dash.getDashboard)
  .post(dash.updateDashboard)
  .delete(dash.deleteDashboard);

module.exports = router;
