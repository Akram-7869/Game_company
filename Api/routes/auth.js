const express = require('express');
const authCtrl = require('../controllers/auth');

const router = express.Router();

const { init, protect, maintenance } = require('../middleware/auth');

router.post('/player/register', maintenance, authCtrl.playerRegister);
router.post('/player/verify', maintenance, authCtrl.verifyPhoneCode);

router.post('/player/login', maintenance, authCtrl.playerLogin);
router.post('/login', authCtrl.login);
router.get('/logout', authCtrl.logout);

//  router.put('/updatedetails', protect, authCtrl.updateDetails);
// router.put('/updatepassword', protect, authCtrl.updatePassword);
router.post('/forgotpassword', authCtrl.forgotPassword);
router.post('/resetpassword/', authCtrl.resetPassword);

module.exports = router;
