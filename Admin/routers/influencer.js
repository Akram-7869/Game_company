const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');
const tournCtl = require('../controllers/TurnamentController');



router.use(protect);

// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardView);
router.route('/tournament').get(tournCtl.listInfluencerTournament);
router.route('/tournament/data').post(tournCtl.getInfluencerTournaments);
router.route('/tournament/join/:id').get(tournCtl.getInfluencerTournament);

// router.get('/login', authCtrl.login);
// router.post('/post-login', authCtrl.postLogin);

// router.get('/forgot-password', authCtrl.forgotPassword);
// router.post('/post-forgot-password', authCtrl.postForgotPassword);

// router.get('/logout', authCtrl.logout);

// router.get('/auth-recoverpw', authCtrl.authRecoverpw);
// router.post('/post-auth-recoverpw', authCtrl.postAuthRecoverpw);

// router.post('/page:name', authCtrl.page);

// router.get('/', (req, res) => {
//     // Redirect to the login page
//     res.redirect('/login');
// });
module.exports = router;
