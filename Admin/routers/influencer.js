const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const tournCtl = require('../controllers/TurnamentController');
const commissionCtl = require('../controllers/CommissionController');
const influencerCtl = require('../controllers/InfluencerController');
const tranCtl = require('../controllers/TransactionController');
const postCtl = require('../controllers/PostController');
const influenecrCtl = require('../controllers/InfluencerController');
const palyerCtrl = require('../controllers/Players');



const {authorize} = require('../middleware/auth');






router.use(protect,authorize('influencer'));

// Route for login page
router.route('/profile').get(influenecrCtl.profile).post(influencerCtl.updateProfile);
router.route('/withdraw').get(influenecrCtl.withdraw);

router.route('/withdraw').post(influenecrCtl.postwithdraw);
router.route('/bank').post(influenecrCtl.addBank);

router.route('/upi').post(influenecrCtl.addUpi);


router.route('/restpassword').get(influenecrCtl.resetPassword);
router.route('/restpassword').post(influenecrCtl.updatePassword);


router.route('/dashboard').get(dashCtl.dashBoardInfluncerView);
router.route('/dashboard/income').post(dashCtl.influencerIncome);


router.route('/tournament').get(tournCtl.listInfluencerTournament);
router.route('/tournament/data').post(tournCtl.getInfluencerTournaments);
router.route('/tournament/join/:id').get(tournCtl.getInfluencerTournament);

router.route('/tournament/add').get(tournCtl.addTournament).post(tournCtl.createTournaments);
router.route('/tournament/:id').get(tournCtl.getTournament).post(tournCtl.updateTournament).delete(tournCtl.deleteTournament);


router.route('/commission').get(commissionCtl.influencerCommList);
router.route('/commission/data').post(commissionCtl.influencerCommData);

router.route('/game/data').post(palyerCtrl.getLeaderBoardList);

 

router.route('/leaderboard').get(influencerCtl.gameList);
router.route('/leaderboard/data').post(influencerCtl.gameData);

router.route('/transaction').get(tranCtl.influencerList);
router.route('/transaction/data').post(tranCtl.getTranscations);

router.route('/posts').get(postCtl.influencerPostList); 
router.route('/posts/data').post(postCtl.getPosts);
router.route('/posts/add').get(postCtl.postAdd).post(postCtl.createPost);
router.route('/posts/:id').get(postCtl.editPost).post(postCtl.updatePost).delete(postCtl.deletePost);


module.exports = router;
