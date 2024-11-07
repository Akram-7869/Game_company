const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Tournament = require('../models/Tournament');
const { makeid } = require('../utils/utils');

// @desc      Get all Tournaments
// @route     GET /api/v1/auth/Tournaments
// @access    Private/Admin
// exports.getTournaments = asyncHandler(async (req, res, next) => {
    
//     Tournament.dataTables({
//         limit: req.body.length,
//         skip: req.body.start,
//         // select: { 'TournamentControle': 1, 'appLink': 1, 'createdAt': 1 },
//         search: {
//             value: req.body.search ? req.body.search.value : '',
//             fields: ['name']

//         },
//         sort: {
//             _id: -1
//         }
//     }).then(function (table) {
//         res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
//     })
//     //res.status(200).json(res.advancedResults);
// });

exports.getTournaments = asyncHandler(async (req, res, next) => {
    // Create filter object for the query
    const filter = {};

    // Add tournamentType to the filter if present in the request body
    if (req.body.tournamentType && req.body.tournamentType !== '') {
        filter.tournamentType = req.body.tournamentType;
    }

    console.log('Applied filter:', filter); // Confirm the filter

    // Ensure that the filter is passed as the query in dataTables()
    Tournament.dataTables({
        limit: req.body.length,
        skip: req.body.start,
        search: {
            value: req.body.search ? req.body.search.value : '',
            fields: ['name']
        },
        sort: {
            _id: -1
        },
        query: filter // This should be applied in the dataTables method
    })
    .then(function (table) {
        res.json({ 
            data: table.data, 
            recordsTotal: table.total, 
            recordsFiltered: table.total, 
            draw: req.body.draw 
        });
    })
    .catch(err => {
        console.error('Error fetching tournament data:', err);
        res.status(500).send('Server error');
    });
});



exports.getInfluencerTournaments = asyncHandler(async (req, res, next) => {
    
    Tournament.dataTables({
        limit: req.body.length,
        skip: req.body.start,
        find:{influencerId:req.user._id},
        // select: { 'TournamentControle': 1, 'appLink': 1, 'createdAt': 1 },
        search: {
            value: req.body.search ? req.body.search.value : '',
            fields: ['name']

        },
        sort: {
            _id: -1
        }
    }).then(function (table) {
        res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
    })
    //res.status(200).json(res.advancedResults);
});

// @desc      Get single Tournament
// @route     GET /api/v1/auth/Tournaments/:id
// @access    Private/Admin
exports.getTournament = asyncHandler(async (req, res, next) => {
    const row = await Tournament.findById(req.params.id).lean();

    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Create Tournament
// @route     POST /api/v1/auth/Tournaments
// @access    Private/Admin
exports.createTournament = asyncHandler(async (req, res, next) => {
    //console.log('req.body', req.body);
    if(req.role ==='influencer'){
        req.body['influencerId']= req.user._id;
        req.body['tournamentType']= 'influencer';
        req.body['room']= makeid(6);

         
    }
    const row = await Tournament.create(req.body);

    res.status(201).json({
        success: true,
        data: row
    });
});

// @desc      Update Tournament
// @route     PUT /api/v1/auth/Tournaments/:id
// @access    Private/Admin
exports.updateTournament = asyncHandler(async (req, res, next) => {

    let row = await Tournament.findById(req.params.id);
    if (!row) {
        return next(
            new ErrorResponse(`Tournament  not found`)
        );
    }

    row = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    //Tournament.isNew = false;
    // await Tournament.save();
    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Delete Tournament
// @route     DELETE /api/v1/auth/Tournaments/:id
// @access    Private/Admin
exports.deleteTournament = asyncHandler(async (req, res, next) => {
    const row = await Tournament.findById(req.params.id);
    await Tournament.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {}
    });
});

