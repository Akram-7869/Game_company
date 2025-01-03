const express = require('express');
const authCtrl = require('../controllers/auth');

const router = express.Router();

const { init, protect, maintenance_chk } = require('../middleware/auth');

router.post('/player/register', maintenance_chk, authCtrl.playerRegister);
router.post('/player/registeremail', maintenance_chk, authCtrl.playerRegisterEmail);
router.post('/register-web', maintenance_chk, authCtrl.webRegisterEmail);

router.post('/influencer/register', maintenance_chk, authCtrl.registerInfluencer);

router.get('/maintanance', maintenance_chk, authCtrl.maintanance);
//router.get('/test', authCtrl.test);
router.post('/player/verify', maintenance_chk, authCtrl.verifyPhoneCode);
//router.get('/getbyphone', authCtrl.getByPhone);
//router.get('/getbyemail', authCtrl.getByEmail);

//router.post('/player/login', maintenance_chk, authCtrl.playerLogin);
router.post('/login', authCtrl.login);
router.get('/logout', authCtrl.logout);

//  router.put('/updatedetails', protect, authCtrl.updateDetails);
// router.put('/updatepassword', protect, authCtrl.updatePassword);
router.post('/forgotpassword', authCtrl.forgotPassword);
router.post('/resetpassword/', authCtrl.resetPassword);

module.exports = router;
