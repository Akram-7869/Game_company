const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const tournCtl = require('../controllers/TurnamentController');
const commissionCtl = require('../controllers/CommissionController');
const influencerCtl = require('../controllers/InfluencerController');
const tranCtl = require('../controllers/TransactionController');
const postCtl = require('../controllers/PostController');






router.use(protect);

// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardInfluncerView);
router.route('/dashboard/income').post(dashCtl.influencerIncome);


router.route('/tournament').get(tournCtl.listInfluencerTournament);
router.route('/tournament/data').post(tournCtl.getInfluencerTournaments);
router.route('/tournament/join/:id').get(tournCtl.getInfluencerTournament);

router.route('/commission').get(commissionCtl.influencerCommList);
router.route('/commission/data').post(commissionCtl.influencerCommData);

router.route('/transactions').get(tournCtl.listInfluencerTournament);
router.route('/transactions/data').post(tournCtl.getInfluencerTournaments);

router.route('/leaderboard').get(influencerCtl.gameList);
router.route('/leaderboard/data').post(influencerCtl.gameData);

router.route('/transaction').get(tranCtl.transcationList);
router.route('/transaction/data').post(tranCtl.getTranscations);

router.route('/posts').get(postCtl.postList); 
router.route('/posts/data').post(postCtl.getPosts);
router.route('/posts/add').get(postCtl.postAdd).post(postCtl.createPost);
router.route('/posts/:id').get(postCtl.editPost).post(postCtl.updatePost).delete(postCtl.deletePost);


module.exports = router;
