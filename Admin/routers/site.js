const express = require('express');
const router = express.Router({ mergeParams: true });
//const { protect } = require('../middleware/auth');

const authCtrl = require('../controllers/AuthController');



// Route for login page
router.get('/login', authCtrl.login);
router.post('/post-login', authCtrl.postLogin);

router.get('/register/influencer', authCtrl.authRegister);
router.post('/register/influencer', authCtrl.createInfluencer);
router.get('/register/franchise', authCtrl.authRegister);


router.get('/forgot-password', authCtrl.forgotPassword);
router.post('/post-forgot-password', authCtrl.postForgotPassword);
router.get('/unauthorized', (req, res) => {
    res.render('unauthorized'); // unauthorized.ejs
  });
router.get('/logout', authCtrl.logout);

router.get('/auth-recoverpw', authCtrl.authRecoverpw);
router.post('/post-auth-recoverpw', authCtrl.postAuthRecoverpw);

// Google Auth
router.get('/google',  authCtrl.getGoogle);

// Google Auth Callback
router.get('/google/callback', authCtrl.googleCallback );

router.post('/page:name', authCtrl.page);


// Catch-all route to redirect to login
router.get('*', (req, res) => {
  res.redirect('/login');  // Redirects any unmatched routes to the login page
});
module.exports = router;
