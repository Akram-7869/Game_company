const express = require('express');
const tranCtr = require('../controllers/transactions');


const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/player').get(protect, tranCtr.getPlayerTransaction);
router.route('/add/player/:id').post(tranCtr.createTransaction);
router.route('/').post(tranCtr.getTransactions);
router
    .route('/payout/:id')
    .get(tranCtr.getPayoutDetail)
    .post(tranCtr.updatePayoutDetail);
router
    .route('/:id')
    .get(tranCtr.getTransaction)
    .post(tranCtr.updateTransaction)
    .delete(tranCtr.deleteTransaction);

module.exports = router;
