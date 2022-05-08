const express = require('express');
const authCtrl = require('../controllers/auth');

const router = express.Router();

const { init, protect } = require('../middleware/auth');

router.post('/player/register', authCtrl.playerRegister);
router.post('/player/verify', authCtrl.verifyPhoneCode);

router.post('/player/login', authCtrl.playerLogin);
router.post('/login', authCtrl.login);
router.get('/logout', authCtrl.logout);

//  router.put('/updatedetails', protect, authCtrl.updateDetails);
// router.put('/updatepassword', protect, authCtrl.updatePassword);
router.post('/forgotpassword', authCtrl.forgotPassword);
router.post('/resetpassword/', authCtrl.resetPassword);

module.exports = router;
