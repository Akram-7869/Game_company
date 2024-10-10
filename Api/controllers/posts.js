const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Post = require('../models/Post');
var path = require('path');
const { uploadFile, deletDiskFile } = require('../utils/utils');


// @desc      Get all Posts
// @route     GET /api/v1/auth/Posts
// @access    Private/Admin
exports.getPosts = asyncHandler(async (req, res, next) => {
let filter ={
  limit: req.body.length,
  skip: req.body.start,
  //   select:{'postUrl':1, 'createdAt':1},
  search: {
    value: req.body.search ? req.body.search.value : '',
    fields: ['status']
  },
  find:{},
  sort: {
    _id: -1
  }
}

if(req.role == 'influencer'){
  filter['find']['owner'] = req.user._id;
}else if(req.role == 'player'){
  filter['find']['owner'] = req.player._id;
}




  Post.dataTables(filter).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});
// @desc      Get all Posts
// @route     GET /api/v1/auth/Posts
// @access    Private/Admin
exports.getPostFeed = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1; // Current page (1-indexed)
  const limit = parseInt(req.query.limit) || 10; // Number of influencers per page
  // const posts  = await Post.find(
  //   { status: 'active' },
  //   { 
  //     comments: 0, // Exclude comments
  //     likes: { $elemMatch: { $eq: req.player._id } } // Only include the user's like
  //   }
  // );
  const posts = await Post.aggregate([
    {
      $match: { status: 'active' }, // Filter by the post status
    },
    // {
    //   $addFields: {
    //     likeCount: { $size: '$likes' }, // Add likeCount by counting likes array
    //     commentCount: { $size: '$comments' }, // Add commentCount by counting comments array
    //     postImageUrl: { $concat: [process.env.IMAGE_URL, '$imageId'] }, // Add postImageUrl by concatenating imageId
    //   },
    // },
    
    {
      $sort: { _id: -1 }, // Sort by _id in descending order
    },
   
    { $skip: (page - 1) * limit }, // Skip for pagination
    { $limit: limit }, // Limit for pagination
    {
      $project: {
        // Project all existing fields using "$$ROOT"
        
        owner: 1,
        userType: 1,
        displayName: 1,
        profileImage: 1,
        imageId: 1,
        description: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
       
       
        
        likeCount: { $size: '$likes' }, // Count the number of likes
        commentCount: { $size: '$comments' }, // Count the number of comments
        postImageUrl: { $concat: [process.env.IMAGE_URL, '$imageId'] }, 
        likes: {
          $filter: {
            input: '$likes', // The array to filter
            as: 'like', // Alias for each element in the array
            cond: { $eq: ['$$like', req.player._id] }, // Condition: Check if the element equals the player's ID
          },
        },
      },
    }
  ]);

  //.populate('likes', 'firstName').populate('player', 'firstName').populate('comments.player', 'firstName');

  res.status(200).json({
    success: true,
    data: posts
  });
});
exports.getPostLikes = asyncHandler(async (req, res, next) => {

  const posts = await Post.findOne({ status: 'active' }).populate('likes', 'firstName').populate('player', 'firstName');

  res.status(200).json({
    success: true,
    data: posts
  });
});
exports.getPostComments = asyncHandler(async (req, res, next) => {

  const posts = await Post.findOne({_id:req.params.id, status: 'active' }).select({comments:1}).populate('comments.player', 'firstName').lean();


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
  console.log(req.body,'-----------', req.files, );
  let{files,description,filename, displayName='', profileImage, status='active'}=req.body;
  let owner = '';   
  let defaultFprofileImage = process.env.API_URI + '/assets/img/logo/profile_default.png';
  let userType='player';
  if (req.role =='player') {
    owner = req.player._id;
    // displayname=req.player.firstName;
    if (!files) { }
    const file = req.files.file;
   
    if (file) {
          filename = '/img/post/' + file.name;
          uploadFile(req, filename, res);
    }
    
  } else if (req.role =='influencer') {
     owner = req.user._id;
     displayName=req.user.displayname;
     userType='influencer';
  }else if (req.role =='admin' || req.role =='manager') {
    owner = req.staff._id;
    displayName=req.staff.displayname;
    userType='admin';
  }

 
  

  let post = {
    owner: owner,
    displayName,
    description: description,
    status:status,
    imageId: filename,
    postType: req.body.postType,
    profileImage,
    userType,
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
  let fieldsToUpdate = { description: req.body.description, status: req.body.status };
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

exports.deleteMyPost = asyncHandler(async (req, res, next) => {
  const row = await Post.find({_id: req.params.id, owner:req.user._id});
  if(!row){
    return next(new ErrorResponse(`Post not found`));
  }
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
    return next(new ErrorResponse(`Post not found`));
  }

  // Check if the player already liked the post
  const hasLiked = row.likes.includes(req.player._id);

  let update;
  
  if (hasLiked) {
    // Unlike: remove player ID from likes
    update = { $pull: { likes: req.player._id } };
  } else {
    // Like: add player ID to likes
    update = { $addToSet: { likes: req.player._id } };
  }

  const post = await Post.updateOne(
    { _id: req.params.id },
    update
  );

  res.status(200).json({
    success: true,
    data: post,
    // message: hasLiked ? 'Post unliked' : 'Post liked',
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
  let post = await Post.updateOne(
    { _id: req.params.id },
    { $addToSet: { comments: comment } }
  )
  res.status(200).json({
    success: true,
    data: post
  });
});
