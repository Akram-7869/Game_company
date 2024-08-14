const express = require('express');
const {
    createTournament,
    getTournament,
    getTournaments,
    updateTournament,
    deleteTournament,
    getInfluencerTournaments,
} = require('../controllers/tournament');


const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/add').post(createTournament);
router.route('/').post(getTournaments);
router.route('/influencer-list').post(getInfluencerTournaments);


router
    .route('/:id')
    .get(getTournament)
    .post(updateTournament)
    .delete(deleteTournament);

module.exports = router;
