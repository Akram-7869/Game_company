const express = require('express');
const {
  playerRegister, verifyPhoneCode, chkPin,
  setPin, playerInfo, debiteAmount, join, creditAmount, login, logout, playerLogin
} = require('../controllers/auth');

const router = express.Router();

const { init, protect } = require('../middleware/auth');

router.post('/player/register', playerRegister);
router.post('/player/verify', verifyPhoneCode);

router.post('/player/login', playerLogin);
router.post('/login', login);
router.get('/logout', logout);

//  router.put('/updatedetails', protect, updateDetails);
// router.put('/updatepassword', protect, updatePassword);
// router.post('/forgotpassword', forgotPassword);
// router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
