const asyncHandler = require('../middleware/async');
const { callApi } = require('../helper/common');
var apiUrl = 'http://localhost:3000/api/v1/Tournaments/';


exports.listTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament' };
    res.render('Tournament/list');
});


exports.getTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament' };
    callApi(req).get(apiUrl + req.params.id)
        .then(r => {

            res.locals = { title: 'Tournament-edit' };
            res.render('Tournament/edit', { row: r.data.data });
        })
        .catch(error => {

        })
});


exports.updateTournament = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    callApi(req).post(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Tournament-edit' };
            req.flash('error', 'Data save');
            res.render('Tournament/edit', { row: r.data.data });

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
            req.flash('success', 'Deleted');
            // res.render('Players/List',{row:r.data.data}); 

        }).catch(error => { req.flash('error', 'Data not updated'); })

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


exports.addTournament = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament' };

    res.render('Tournament/add', { row: {} });
});


exports.createTournaments = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Tournament-add' };
    callApi(req).post(apiUrl + 'add', req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Tournament-edit' };
            req.flash('success', 'Data save');
            res.render('Tournament/edit', { row: r.data.data });

        })
        .catch(error => {


            req.flash('error', 'Data not updated');

        })
    res.render('Tournament/edit', { row: {} });
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
