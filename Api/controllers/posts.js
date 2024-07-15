const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Post = require('../models/Post');
var path = require('path');
const { uploadFile, deletDiskFile } = require('../utils/utils');


// @desc      Get all Posts
// @route     GET /api/v1/auth/Posts
// @access    Private/Admin
exports.getPosts = asyncHandler(async (req, res, next) => {

  Post.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    //   select:{'postUrl':1, 'createdAt':1},
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['status']
    },
    sort: {
      _id: -1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});
// @desc      Get all Posts
// @route     GET /api/v1/auth/Posts
// @access    Private/Admin
exports.getPostFeed = asyncHandler(async (req, res, next) => {

  const posts = await Post.find({status:'active'});
  
  //.populate('likes', 'firstName').populate('player', 'firstName').populate('comments.player', 'firstName');
 
  res.status(200).json({
    success: true,
    data: posts
  });
});
exports.getPostLikes = asyncHandler(async (req, res, next) => {

  const posts = await Post.findOne({status:'active'}).populate('likes', 'firstName').populate('player', 'firstName');
 
  res.status(200).json({
    success: true,
    data: posts
  });
});
exports.getPostComments = asyncHandler(async (req, res, next) => {

  const posts = await Post.findOne({status:'active'}).populate('comments.player', 'firstName');
 
  res.status(200).json({
    success: true,
    data: posts
  });
});
// @desc      Get single Post
// @route     GET /api/v1/auth/Posts/:id
// @access    Private/Admin
exports.getPost = asyncHandler(async (req, res, next) => {
  const row = await Post.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Create Post
// @route     POST /api/v1/auth/Posts
// @access    Private/Admin
exports.createPost = asyncHandler(async (req, res, next) => {
  if (!req.files) {}
  let filename;
  if (req.files) {
    filename = '/img/post/' + req.files.file.name;
    uploadFile(req, filename, res);
  }

  let post = {
    player:req.player._id ,
    title: req.body.title,
    status: 'active',
    imageId: filename,
    postType: req.body.postType
  }

  const row = await Post.create(post);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update Post
// @route     PUT /api/v1/auth/Posts/:id
// @access    Private/Admin
exports.updatePost = asyncHandler(async (req, res, next) => {
  //console.log('sdsdsssdsdsdsd',req.body,req.files, req.query);
  let row = await Post.findById(req.params.id);

  if (!row) {
    return next(
      new ErrorResponse(`Post  not found`)
    );
  }


  let filename;
  let fieldsToUpdate = { title: req.body.title, status: req.body.status, postType: req.body.postType };
  if (req.files) {
    filename = '/img/post/' + req.files.file.name;
    let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
    deletDiskFile(filePath);
    uploadFile(req, filename, res);
    fieldsToUpdate['imageId'] = filename;
  }

  row = await Post.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: row
  });
});


// @desc      Delete Post
// @route     DELETE /api/v1/auth/Posts/:id
// @access    Private/Admin
exports.deletePost = asyncHandler(async (req, res, next) => {
  const row = await Post.findById(req.params.id);
  await Post.findByIdAndDelete(req.params.id);
  let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
  deletDiskFile(filePath);

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.likePost = asyncHandler(async (req, res, next) => {
  const row = await Post.findById(req.params.id);
  if (!row) {
    return next(
      new ErrorResponse(`Post  not found`)
    );
  }
  let post = await Post.updateOne(
    { _id: req.params.id },
    { $addToSet: { likes: req.player._id } }
  )
  res.status(200).json({
    success: true,
    data: post
  });
});

exports.commentOnPost = asyncHandler(async (req, res, next) => {
  const row = await Post.findById(req.params.id);
  if (!row) {
    return next(
      new ErrorResponse(`Post  not found`)
    );
  }
  const comment = {
    content: req.body.content,
     player: req.player._id
  };
   let  post = await Post.updateOne(
    { _id: req.params.id },
    { $addToSet: { comments: comment} }
  )
  res.status(200).json({
    success: true,
    data: post
  });
});
