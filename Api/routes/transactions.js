const express = require('express');
const {

    createTransaction,
    getTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction

} = require('../controllers/transactions');


const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
router.use(protect);

router.route('/add').post(createTransaction);
router.route('/').post(getTransactions);

router
    .route('/:id')
    .get(getTransaction)
    .post( updateTransaction)
    .delete( deleteTransaction);

module.exports = router;
