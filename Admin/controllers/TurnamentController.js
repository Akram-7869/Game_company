const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
var apiUrl = api_url + '/Tournaments/';


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
            res.render('Tournament/edit', { row: r.data.data });
        })
        .catch(error => {

        })
});

exports.getInfluencerTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament', apiUrl };
    callApi(req).get(apiUrl + req.params.id)
        .then(r => {
            res.locals = { title: 'Tournament' };
            res.render('Tournament/influencer-lion', { row: r.data.data});
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

    callApi(req).post(apiUrl, { ...req.body })
        .then(r => {
            // Assign value in session
            res.status(200).json(r.data);
        })
        .catch(error => {
            //   req.flash('error', 'Incorrect email or password!');
        })
});
exports.getInfluencerTournaments = asyncHandler(async (req, res, next) => {

    callApi(req).post(apiUrl+'influencer-list', { ...req.body })
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
    callApi(req).post(apiUrl + 'add', req.body)
        .then(r => {
            // Assign value in session
            req.flash('message', 'Data save');

            res.redirect(process.env.ADMIN_URL + '/admin/tournament');
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
