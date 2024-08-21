const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const tournCtl = require('../controllers/TurnamentController');
const commissionCtl = require('../controllers/CommissionController');




router.use(protect);

// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardView);
router.route('/tournament').get(tournCtl.listInfluencerTournament);
router.route('/tournament/data').post(tournCtl.getInfluencerTournaments);
router.route('/tournament/join/:id').get(tournCtl.getInfluencerTournament);
router.route('/commission').get(commissionCtl.influencerCommList);
router.route('/commission/data').post(commissionCtl.influencerCommData);

router.route('/transactions').get(tournCtl.listInfluencerTournament);
router.route('/transactions/data').post(tournCtl.getInfluencerTournaments);
module.exports = router;
