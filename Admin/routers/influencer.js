const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

const dashCtl = require('../controllers/Dashboard');


router.use(protect);

// Route for login page
router.route('/dashboard').get(dashCtl.dashBoardView);

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
