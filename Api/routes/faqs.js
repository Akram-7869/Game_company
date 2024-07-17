const express = require('express');
const ctrlFaq = require('../controllers/faqs');

const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
router.use(protect);

router.route('/list').get(ctrlFaq.getFaqList);

router.route('/add').post(ctrlFaq.createFaq);
router.route('/').post(ctrlFaq.getFaqs);

router
    .route('/:id')
    .get(ctrlFaq.getFaq)
    .post( ctrlFaq.updateFaq)
    .delete( ctrlFaq.deleteFaq);

module.exports = router;
