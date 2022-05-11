const express = require('express');
const pollCtrl = require('../controllers/polls');


const router = express.Router({ mergeParams: true });
//const { protect} = require('../middleware/auth');

//router.use(protect);
router.route('/image/:id').get(pollCtrl.getFile);
router.route('/uploadfile').post(pollCtrl.uploadFile);
router.route('/add').post(pollCtrl.createPoll);
router.route('/').post(pollCtrl.getPolls);

router
    .route('/:id')
    .get(pollCtrl.getPoll)
    .post(pollCtrl.updatePoll)
    .delete(pollCtrl.deletePoll);

module.exports = router;
