const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const tournCtl = require('../controllers/TurnamentController');



router.use(protect);

// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardView);
router.route('/commison').get(tournCtl.listInfluencerTournament);
router.route('/commison/data').post(tournCtl.getInfluencerTournaments);
router.route('/commison-datewise').get(tournCtl.listInfluencerTournament);
router.route('/commison-datewise/data').post(tournCtl.getInfluencerTournaments);
router.route('/transactions').get(tournCtl.listInfluencerTournament);
router.route('/transactions/data').post(tournCtl.getInfluencerTournaments);
module.exports = router;
