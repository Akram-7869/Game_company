const asyncHandler = require('../middleware/async');
let axios = require("axios");
const { callApi, api_url, uploadFile } = require('../helper/common');

let apiUrl = api_url + '/posts/';

exports.postList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post', apiUrl, image_url: process.env.IMAGE_URL ,originalUrl: req.originalUrl};
      res.render('Post/list')
});
exports.influencerPostList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post', apiUrl, image_url: process.env.IMAGE_URL ,originalUrl: req.originalUrl};
      res.render('Post/influencer-list')
});
exports.getPosts = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session
                  res.status(200).json(r.data);
            })
            .catch(error => {
                  //   req.flash('error', 'Incorrect email or password!');
            })

});
exports.getPost = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post', 'apiUrl': apiUrl, indexUrl: handleIndexUrl(req), image_url: process.env.IMAGE_URL};
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  res.locals = { title: 'Post' };
                  res.render('Post/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updatePost = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post' };
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  req.flash('message', 'Data save');
                  handleRedirect(req,res);

             })
            .catch(error => { req.flash('error', 'Data not updated'); })
});
exports.editPost = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post', apiUrl, indexUrl: handleIndexUrl(req) ,originalUrl: req.originalUrl };
      callApi(req).get(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.render('Post/edit', { row: r.data.data });
            })
            .catch(error => {

                  req.flash('error', 'Data not updated');

            })
});

exports.deletePost = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('success', 'Deleted');
                  // res.render('Players/List',{row:r.data.data}); 

            }).catch(error => { req.flash('error', 'Data not updated'); })
      res.status(200).json({
            success: true,
            data: {}
      });
});




exports.getPost = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session

                  res.status(200).json(r.data);


            })
            .catch(error => {

                  //   req.flash('error', 'Incorrect email or password!');

            })

});


exports.postAdd = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post', 'apiUrl': apiUrl, indexUrl: handleIndexUrl(req), image_url: process.env.IMAGE_URL };

      res.render('Post/add', { row: {} });
});

let handleIndexUrl =(req)=>{
      if (req.role === 'influencer'){
     return       process.env.ADMIN_URL + '/influencer/posts';
      }else {
     return process.env.ADMIN_URL + '/admin/posts'
      }
}
let handleRedirect =(req,res)=>{
      if (req.role === 'influencer'){
            res.redirect(process.env.ADMIN_URL + '/influencer/posts');
      }else {
      res.redirect(process.env.ADMIN_URL + '/admin/posts');
      }
}
exports.createPost = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post' };
      let { description, status } = req.body;

     // console.log('creating-image', req.files);
      const file = req.files.file;


      let filename;
      if (file) {
            filename = '/img/post/' + file.name;
            uploadFile(req, filename, res);
      }
      callApi(req).post(apiUrl + 'add', { filename, description, status })
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Post' };
                  req.flash('message', 'Data save');
                  handleRedirect(req,res);
            })
            .catch(error => {
                  //   

                  req.flash('error', 'Data not updated');

            })
});


