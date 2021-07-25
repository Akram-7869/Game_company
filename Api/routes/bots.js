const express = require('express');
const {

    createBot,
    getBot,
    getBots,
    updateBot,
    deleteBot

} = require('../controllers/boats');


const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
router.use(protect);

router.route('/add').post(createBot);
router.route('/').post(getBots);

router
    .route('/:id')
    .get(getBot)
    .post( updateBot)
    .delete( deleteBot);

module.exports = router;
