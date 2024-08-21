const express = require('express');
const commissionCtrl = require('../controllers/commission');


const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

 router.use(protect);

router.route('/add').post(commissionCtrl.createCommission);
router.route('/').post(commissionCtrl.getCommissions);
// router.route('/list').get(commissionCtrl.getCommissions);

router
    .route('/:id')
    .get(protect, commissionCtrl.getCommission)
    .post(commissionCtrl.updateCommission)
    .delete(protect, commissionCtrl.deleteCommission);

module.exports = router;
