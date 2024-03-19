const express = require('express');
const gameManager = require('../controllers/gameManager');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

//router.use(protect);

router.route('/add').post(gameManager.createGame);
router.route('/upload/:id').post(gameManager.uploadeImage);

router.route('/').post(gameManager.getGames);

router
    .route('/:id')
    .get(gameManager.getGame)
    .post(gameManager.updateGame)
    .delete(gameManager.deleteGame);

module.exports = router;
