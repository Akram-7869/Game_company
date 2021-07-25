// const ErrorResponse = require('../utils/errorResponse');
 const asyncHandler = require('../middleware/async');
// const {Players} = require('../models/Players');
// const {User} = require('../models/User');
 const {callApi} = require('../helper/common');
 
var apiUrl = 'http://localhost:3000/api/v1/players/';
// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getPlayers = asyncHandler(async (req, res, next) => {
      console.log('session',req.session)
    res.locals = { title: 'Datatables' };
    res.render('Players/list')
});
 
// @desc      Get  Player
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getPlayer = asyncHandler(async (req, res, next) => {
      console.log('ssss',req.session.user.token);
      // const config = {
      //       headers: { Authorization: `Bearer ${req.session.user.token}` }
      //   };
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl+ req.params.id)
            .then(r => {
                  // Assign value in session
                 console.log('dddddd',r.data.data);
                  res.locals = { title: 'Player-edit' };
                  res.render('Players/edit',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
  
            })
            .catch(error => {
                  console.error(error.error)
  
               //   req.flash('error', 'Incorrect email or password!');
                //  res.redirect('/login');
            })
  });
 
// @desc      Get  Player
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.updatePlayer = asyncHandler(async (req, res, next) => {
      console.log('kamleshshsh',req.body,'query',req.query)
      res.locals = { title: 'Datatables' };
      callApi(req).post(apiUrl+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('error', 'Data save');
                  res.render('Players/edit',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
            })
            .catch(error => {
                  console.log(error)
  
                 req.flash('error', 'Data not updated');
                //  res.redirect('/login');
            })
  });
// @desc      Get  Player
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.updatePlayerStatus = asyncHandler(async (req, res, next) => {
      console.log('kamleshshsh',req.body,'query',req.query)
      res.locals = { title: 'Datatables' };
      callApi(req).post(apiUrl+ 'status/'+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('success', 'Data save');
                  res.render('Players/edit',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
            })
            .catch(error => {
                  console.log(error)
  
                 req.flash('error', 'Data not updated');
                //  res.redirect('/login');
            })
  });
  // @desc      Delete Player
// @route     DELETE /api/v1/auth/Players/:id
// @access    Private/Admin
exports.deletePlayer = asyncHandler(async (req, res, next) => {
      console.log('del',req.params.id);
    
      res.status(200).json({
        success: true,
        data: {}
      });
    });
    


    // @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getPlayerList = asyncHandler(async (req, res, next) => {
      console.log('qwwwwwe', req.session);
      // const config = {
      //       headers: { Authorization: `Bearer ${req.session.user.token}` }
      //   };
        callApi(req).post(apiUrl, { ...req.body  } )
          .then(r => {
                // Assign value in session
                console.log('list', r.data) 
                
                res.status(200).json(r.data);
                
                //  console.log(`statusCode: ${res.statusCode}`)

          })
          .catch(error => {
                console.log(error.error)

             //   req.flash('error', 'Incorrect email or password!');
              //  res.redirect('/login');
          })
    
    });

    // @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getAddForm = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
     
      res.render('Players/edit',{row:{}});
});
  
    // @desc      Get all Players
// @route     POST /api/v1/Players
// @access    Private/Admin
exports.createPlayers = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
      callApi(req).post(apiUrl,req.body)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Player-edit' };
            req.flash('success', 'Data save');
            res.render('Players/edit',{row:r.data.data}); 
            //  console.log(`statusCode: ${res.statusCode}`)
      })
      .catch(error => {
            console.log(error)

           req.flash('error', 'Data not updated');
          //  res.redirect('/login');
      })
      res.render('Players/edit',{row:{}});
});

    // @desc      Get all Players
// @route     POST /api/v1/Players
// @access    Private/Admin
exports.showPlayerView = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl+ req.params.id)
            .then(r => {
                  // Assign value in session
                 console.log('dddddd',r.data.data);
                  res.locals = { title: 'Player-edit' };
                  res.render('Players/view',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
  
            })
            .catch(error => {
                  console.error(error.error)
  
               //   req.flash('error', 'Incorrect email or password!');
                //  res.redirect('/login');
            })
});
 

exports.getProfile = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl+'profile/'+ req.params.id)
            .then(r => {
                 console.log('dddddd',r.data.data);
                  res.locals = { title: 'Player-edit' };
                  res.render('Players/edit',{row:r.data.data}); 
  
            })
            .catch(error => {
                  console.error(error.error)
            })

});
exports.updateProfile = asyncHandler(async (req, res, next) => {
      console.log('kamleshshsh',req.body,'query',req.query)
      res.locals = { title: 'Datatables' };
      callApi(req).post(apiUrl+'profile/'+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('error', 'Data save');
                  res.render('Players/edit',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
            })
            .catch(error => {
                  console.log(error)
  
                 req.flash('error', 'Data not updated');
                //  res.redirect('/login');
            })
});
