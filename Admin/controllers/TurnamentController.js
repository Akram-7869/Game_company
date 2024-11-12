const asyncHandler = require('../middleware/async');
const { callApi, api_url } = require('../helper/common');
const apiUrl = api_url + '/Tournaments/';
const agodaAppId ='0f62fbaad9c446a3b1b7be2ba203be49'

exports.listTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament' };
    res.render('Tournament/list', { 'message': req.flash('message'), 'error': req.flash('error') });
});

exports.listInfluencerTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament' };
    res.render('Tournament/influencer-list', { 'message': req.flash('message'), 'error': req.flash('error') });
});


exports.getTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament' };
    callApi(req).get(apiUrl + req.params.id)
        .then(r => {
            res.locals = { title: 'Tournament' };
            if (r.data.data.mode == 5) {
                res.render('Tournament/tambola-edit', { row: r.data.data });
            } else if (r.data.data.mode == 1) {
                res.render('Tournament/ludo-edit', { row: r.data.data });
            } else if (r.data.data.mode == 3) {
                res.render('Tournament/teen-patti-edit', { row: r.data.data });
            } else {
                res.render('Tournament/edit', { row: r.data.data });
            }
        })
        .catch(error => {

        })
});

exports.getInfluencerTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament', apiUrl };
    callApi(req).get(apiUrl + req.params.id)
        .then(r => {
            res.locals = { title: 'Tournament' };
            const sessionData = req.session.user;
            if (r.data.data.mode == 5) {
                res.render('Tournament/influencer-tambola', { row: r.data.data, agodaAppId, user: req.session.user });
            } else if (r.data.data.mode == 1) {
                res.render('Tournament/influencer-ludo', { row: r.data.data, agodaAppId, user: req.session.user });
            } else if (r.data.data.mode == 3) {
                res.render('Tournament/influencer-teen-patti', { row: r.data.data, agodaAppId, user: req.session.user });
            } else if (r.data.data.mode == 2) {
                res.render('Tournament/influencer-lion', { row: r.data.data, agodaAppId, user: req.session.user });
            } else if (r.data.data.mode == 4) {
                res.render('Tournament/influencer-rouletee', { row: r.data.data, agodaAppId, user: req.session.user });
            } else if (r.data.data.mode == 6) {
                res.render('Tournament/influencer-crash', { row: r.data.data, agodaAppId, user: req.session.user });
            }
        })
        .catch(error => {

        })
});





exports.updateTournament = asyncHandler(async (req, res, next) => {

    callApi(req).post(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session

            req.flash('message', 'Data save');

            res.redirect(process.env.ADMIN_URL + '/admin/tournament');
        })
        .catch(error => {
            req.flash('error', 'Data not updated');
        })
});


exports.deleteTournament = asyncHandler(async (req, res, next) => {
    callApi(req).delete(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Tournament' };
            req.flash('message', 'Deleted');
            // res.render('Players/List',{row:r.data.data}); 

        }).catch(error => { req.flash('error', 'Data not deleted'); })

    res.status(200).json({
        success: true,
        data: {}
    });
});






exports.getTournaments = asyncHandler(async (req, res, next) => {
    console.log('Received tournamentType:', req.body.tournamentType); // Log for debugging

    callApi(req).post(apiUrl, { ...req.body })
        .then(r => {
            res.status(200).json(r.data); // Ensure API response format matches DataTables
        })
        .catch(error => {
            console.error('Error fetching tournaments:', error); // Log errors for troubleshooting
            res.status(500).send('Server error');
        });
});


exports.getInfluencerTournaments = asyncHandler(async (req, res, next) => {

    callApi(req).post(apiUrl + 'influencer-list', { ...req.body })
        .then(r => {
            // Assign value in session
            res.status(200).json(r.data);
        })
        .catch(error => {
            //   req.flash('error', 'Incorrect email or password!');
        })
});

exports.addTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament' };

    res.render('Tournament/add', { row: {} });
});


exports.createTournaments = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament-add' };
    console.log('add-tourn', req.body);
    callApi(req).post(apiUrl + 'add', req.body)
        .then(r => {
            console.log('response', r.data);
            // Assign value in session
            // req.flash('message', 'Data save');
            if (req.role === 'admin') {
                res.redirect(process.env.ADMIN_URL + '/admin/tournament/' + r.data.data._id);
            } else if (req.role === 'influencer') {
                res.redirect(process.env.ADMIN_URL + '/influencer/tournament/' + r.data.data._id);
            }

        })
        .catch(error => {
            req.flash('error', 'Data not updated');
        })

});

exports.showTournament = asyncHandler(async (req, res, next) => {
    callApi(req).get(apiUrl + req.params.id)
        .then(r => {
            // Assign value in session

            res.locals = { title: 'Tournament-edit' };
            res.render('Tournament/view', { row: r.data.data });


        })
        .catch(error => {


            //   req.flash('error', 'Incorrect email or password!');

        })
});
