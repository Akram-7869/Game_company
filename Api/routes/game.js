const express = require('express');
const game = require('../controllers/games');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/add').post(game.createPlayerGame);
router.route('/').post(game.getPlayerGames);
router.route('/leaderboard').get(game.getPlayerLeaderBoard);

router
  .route('/:id')
  .get(game.getPlayerGame)
  .post(game.updatePlayerGame)
  .delete(game.deletePlayerGame);

module.exports = router;
