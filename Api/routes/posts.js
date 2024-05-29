const express = require('express');
const ctrlPost = require('../controllers/posts');


const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
router.use(protect);

router.route('/postfeed').get(ctrlPost.getPostFeed);

router.route('/add').post(ctrlPost.createPost);
router.route('/').post(ctrlPost.getPosts);
//router.post('/:id/like', auth, ctrlPost.likePost);
//router.post('/:id/comment', auth, ctrlPost.commentOnPost);
router
    .route('/:id')
    .get(ctrlPost.getPost)
    .post( ctrlPost.updatePost)
    .delete( ctrlPost.deletePost);

module.exports = router;
