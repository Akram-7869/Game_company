const express = require('express');
const {

    createTransaction,
    getTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    getPlayerTransaction

} = require('../controllers/transactions');


const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/player').get(getPlayerTransaction);
router.route('/add/player/:id').post(createTransaction);
router.route('/').post(getTransactions);

router
    .route('/:id')
    .get(getTransaction)
    .post(updateTransaction)
    .delete(deleteTransaction);

module.exports = router;
