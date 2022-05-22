// const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
// const {Players} = require('../models/Players');
// const {User} = require('../models/User');
const { callApi, api_url, redirect } = require('../helper/common');

var apiUrl = api_url + '/players/';
var apiUrlGame = api_url + '/games/';
var apiUrlTransaction = api_url + '/transactions/';

exports.getPlayerReport = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player' };
      res.render('Reports/player')
});
exports.getPaymentReport = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'PaymentList' };
      res.render('Reports/payment', { playerId: '' })
});


exports.getChatList = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Chat' };
      res.render('Ticket/chat')
});

exports.getPlayerNotification = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player Notification' };
      res.render('Players/notifcation')
});
exports.getPlayerPayout = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player Payout' };
      res.render('Payments/payout')
});
exports.getPlayerPayoutEdit = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player Payout' };
      callApi(req).get(apiUrlTransaction + 'payout/' + req.params.id)
            .then(r => {
                  //console.log(r.data.data);
                  res.render('Payments/payoutedit', { row: r.data.data });
            })
            .catch(error => {//   req.flash('error', 'Incorrect email or password!');})
            });
});
exports.postPlayerPayoutEdit = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrlTransaction + 'payout/' + req.params.id, req.body)
            .then(r => {
                  res.redirect(process.env.ADMIN_URL + '/admin/payout');
            })
            .catch(error => {
                  req.flash('error', 'Data not updated');
            })
});

exports.getPlayerWallet = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player Wallet' };
      res.render('Payments/wallet')
});
exports.getPlayerBanned = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player Banned' };
      res.render('Players/banned')
});

exports.getPlayerKyc = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player Kyc' };
      res.render('Players/kyc')
});
exports.getPlayerMembership = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player Membership' };
      res.render('Players/membership')
});
exports.getPlayerHistory = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player History' };
      res.render('Players/history', { playerId: req.params.id })
});
exports.getLeaderBoard = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Leader Board' };
      res.render('Players/leaderboard')
});
exports.getLeaderBoardList = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrlGame, { ...req.body }, { params: req.query })
            .then(r => {
                  res.status(200).json(r.data);
            })
            .catch(error => {//   req.flash('error', 'Incorrect email or password!');})
            });
});


// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getPlayers = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player' };
      res.render('Players/list')
});

// @desc      Get  Player
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getPlayer = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  res.render('Players/edit', { row: r.data.data });
            })
            .catch(error => {//   req.flash('error', 'Incorrect email or password!');})
            });
});

// @desc      Get  Player
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.updatePlayer = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player' };
      //console.log(req.body);
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/player');

            })
            .catch(error => {
                  req.flash('error', 'Data not updated');
            })
});
// @desc      Get  Player
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.updatePlayerStatus = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player' };
      callApi(req).post(apiUrl + 'status/' + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('message', 'Data save');
                  res.render('Players/edit', { row: r.data.data });

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

// @desc      Get  Player
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.creditPlayer = asyncHandler(async (req, res, next) => {
      //console.log(req.body);
      res.locals = { title: 'Player' };
      callApi(req).post(apiUrl + 'credit/' + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('message', 'Data save');
                  res.render('Players/edit', { row: r.data.data });

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});
// @desc      Delete Player
// @route     DELETE /api/v1/auth/Players/:id
// @access    Private/Admin
exports.deletePlayer = asyncHandler(async (req, res, next) => {

      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('success', 'Deleted');
                  // res.render('Players/List',{row:r.data.data}); 

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
      res.status(200).json({
            success: true,
            data: {}
      });
});



// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getPlayerList = asyncHandler(async (req, res, next) => {
      //  console.log('qwwwwwe', req.session);
      // const config = {
      //       headers: { Authorization: `Bearer ${req.session.user.token}` }
      //   };
      //console.log('url', req.url);




      callApi(req).post(apiUrl, { ...req.body }, { params: req.query })
            .then(r => {
                  // Assign value in session


                  res.status(200).json(r.data);



            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })

});

// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getAddForm = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };

      res.render('Players/edit', { row: {} });
});

// @desc      Get all Players
// @route     POST /api/v1/Players
// @access    Private/Admin
exports.createPlayers = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
      callApi(req).post(apiUrl, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('message', 'Data save');
                  res.render('Players/edit', { row: r.data.data });

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
      res.render('Players/edit', { row: {} });
});

// @desc      Get all Players
// @route     POST /api/v1/Players
// @access    Private/Admin
exports.showPlayerView = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session

                  res.locals = { title: 'Player-edit' };
                  res.render('Players/view', { row: r.data.data });


            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })
});


exports.getProfile = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player' };
      callApi(req).get(apiUrl + 'profile/' + req.params.id)
            .then(r => {

                  res.locals = { title: 'Player-edit' };
                  res.render('Players/edit', { row: r.data.data });

            })
            .catch(error => {

            })

});
exports.updateProfile = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player' };
      callApi(req).post(apiUrl + 'profile/' + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('error', 'Data save');
                  res.render('Players/edit', { row: r.data.data });

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});
