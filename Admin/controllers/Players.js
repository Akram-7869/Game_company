// const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
// const {Players} = require('../models/Players');
// const {User} = require('../models/User');
const { callApi, api_url, redirect, stateList } = require('../helper/common');
const moment = require('moment');

var apiUrl = api_url + '/players/';
var apiUrlGame = api_url + '/games/';
var apiUrlTransaction = api_url + '/transactions/';

exports.playerPayoutApprove = asyncHandler(async (req, res, next) => {


      res.locals = { title: 'Player' };
      callApi(req).post(api_url + '/payments/cashfree/payout', { withdrawId: req.params.id })
            .then(r => {
                  res.status(200).json(r.data);
                  //res.render('Reports/payoutprocessing', { row: r.data.data });
            })
            .catch(error => {
                  res.status(400).json(error);
                  //   req.flash('error', 'Incorrect email or password!');})
            });
});
// exports.playerPayoutDecline = asyncHandler(async (req, res, next) => {

//       res.locals = { title: 'Player' };
//       res.render('Reports/payoutresponse')
// });
exports.getPlayerReport = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Player' };
      res.render('Reports/player')
});
exports.getPaymentReport = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'PaymentList' };
      res.render('Reports/payment', { playerId: '' })
});
exports.adminCommissionReport = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'AdminCommissionList', stateList };
      res.render('Reports/admincommission')
});
exports.tdsReport = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'TDSList', stateList };
      res.render('Reports/tds')
});

exports.tdsReportDownload = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'TDSList', stateList };
      let filename = 'tdsreport.csv';
      if (req.query.report === 'datewise') {
            filename = 'tdsreport-datewise.csv';
      }
      callApi(req).get(api_url + '/transactions/tds', {
            responseType: 'stream', // Set the response type to stream
            params: req.query
      })
            .then(r => {
                  res.set('Content-Disposition', 'attachment; filename=' + filename); // Set the filename and extension of the downloaded file

                  r.data.pipe(res);
                  //res.render('Reports/payoutprocessing', { row: r.data.data });
            })
            .catch(error => {
                  console.log(error)
                  res.status(400).json(error);
                  //   req.flash('error', 'Incorrect email or password!');})
            });

});

exports.gstReport = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'GST List', stateList };
      res.render('Reports/gst')
});

exports.gstReportDownload = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'TDSList', stateList };
      let filename = 'gstreport.csv';
      if (req.query.report === 'datewise') {
            filename = 'gstreport-datewise.csv';
      }
      callApi(req).get(api_url + '/transactions/gst', {
            responseType: 'stream', // Set the response type to stream
            params: req.query
      })
            .then(r => {
                  res.set('Content-Disposition', 'attachment; filename=' + filename); // Set the filename and extension of the downloaded file

                  r.data.pipe(res);
                  //res.render('Reports/payoutprocessing', { row: r.data.data });
            })
            .catch(error => {
                  console.log(error)
                  res.status(400).json(error);
                  //   req.flash('error', 'Incorrect email or password!');})
            });

});

exports.adminCommissionDownload = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Admin Comission', stateList };
      let filename = 'admincommission.csv';
      if (req.query.report === 'datewise') {
            filename = 'admincommission-datewise.csv';
      }
      callApi(req).get(api_url + '/transactions/admincommission', {
            responseType: 'stream', // Set the response type to stream
            params: req.query
      })
            .then(r => {
                  res.set('Content-Disposition', 'attachment; filename=' + filename); // Set the filename and extension of the downloaded file

                  r.data.pipe(res);
                  //res.render('Reports/payoutprocessing', { row: r.data.data });
            })
            .catch(error => {
                  console.log(error)
                  res.status(400).json(error);
                  //   req.flash('error', 'Incorrect email or password!');})
            });

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
                  res.render('Payments/payoutedit', { row: r.data.data, moment });
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
      res.locals = { title: 'Game List' };
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

exports.playerOld = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'OLDPlayer' };
      res.render('Players/oldplayerlist')
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

exports.playerGiftAmount = asyncHandler(async (req, res, next) => {
      //console.log(req.body);
      res.locals = { title: 'Player' };
      callApi(req).post(apiUrl + 'gift-amount/' + req.params.id, req.body)
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
      // res.locals = { title: 'Player-edit' };

      // return callApi(req).delete(apiUrl + req.params.id, req.body)
      //       .then(r => {
      //             // Assign value in session
      //             req.flash('success', 'Deleted');
      //             // res.render('Players/List',{row:r.data.data}); 
      //       })
      //       .catch(error => {
      //             req.flash('error', 'Data not updated');
      //       })

});

// @desc      Delete Player
// @route     DELETE /api/v1/auth/Players/:id
// @access    Private/Admin
exports.deletePlayerData = asyncHandler(async (req, res, next) => {
      // console.log('deleteing->');
      return callApi(req).delete(apiUrl + 'deleteplayerdata/' + req.params.id)
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

exports.deleteOldPlayerData = asyncHandler(async (req, res, next) => {
      // console.log('deleteing->');
      return callApi(req).delete(apiUrl + 'deloldplayer/' + req.params.id)
            .then(r => {
                  res.status(200).json(r.data);
            })
            .catch(error => {
                  res.status(400).json(error);
            })
});
// @desc      Delete Player
// @route     DELETE /api/v1/auth/Players/:id
// @access    Private/Admin
exports.deletePlayerDataByIds = asyncHandler(async (req, res, next) => {
      console.log('deleteing->', req.body);

      return callApi(req).post(apiUrl + 'deleteplayerdata-byids', req.body)
            .then(r => {
                  // Assign value in session
                  res.status(200).json(r.data);
                  // res.render('Players/List',{row:r.data.data}); 
            })
            .catch(error => {
                  res.status(400).json(r.data);

            })

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

exports.getPlayerOldList = asyncHandler(async (req, res, next) => {
      //  console.log('qwwwwwe', req.session);
      // const config = {
      //       headers: { Authorization: `Bearer ${req.session.user.token}` }
      //   };
      //console.log('url', req.url);




      callApi(req).post(apiUrl + '/playerold', { ...req.body }, { params: req.query })
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
