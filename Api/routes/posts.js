const express = require('express');
const ctrlPost = require('../controllers/posts');

const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
router.use(protect);

router.route('/postfeed').get(ctrlPost.getPostFeed);
router.post('/deletemy/:id', ctrlPost.deleteMyPost);

router.route('/add').post(ctrlPost.createPost);
router.route('/').post(ctrlPost.getPosts);
router.post('/:id/like', ctrlPost.likePost);
router.get('/:id/like', ctrlPost.getPostLikes);

router.post('/:id/comment', ctrlPost.commentOnPost);
router.get('/:id/comment', ctrlPost.getPostComments);

router
    .route('/:id')
    .get(ctrlPost.getPost)
    .post( ctrlPost.updatePost)
    .delete( ctrlPost.deletePost);

module.exports = router;
