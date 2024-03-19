const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Game = require('../models/Game');
const PlayerPoll = require('../models/PlayerPoll');
const path = require('path');
const { uploadFile, deletDiskFile } = require('../utils/utils');


exports.getGames = asyncHandler(async (req, res, next) => {

  Game.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['status', 'location']
    },
    sort: {
      _id: -1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
});


exports.getGame = asyncHandler(async (req, res, next) => {
  const row = await Game.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});


exports.createGame = asyncHandler(async (req, res, next) => {

  if (!req.body.name || req.body.version || req.body.status) {
    return next(
      new ErrorResponse(`All Fields Are Required`)
    );
  }
  let banner = {
    name: req.body.name,
    version: req.body.version,
    status: req.body.status
  }

  const row = await Game.create(banner);

  res.status(201).json({
    success: true,
    data: row
  });
});


exports.updateGame = asyncHandler(async (req, res, next) => {
  //console.log('sdsdsssdsdsdsd',req.body,req.files, req.query);
  let row = await Game.findById(req.params.id);

  if (!row) {
    return next(
      new ErrorResponse(`Game  not found`)
    );
  }
  let fieldsToUpdate = {
    name: req.body.name,
    version: req.body.version,
    status: req.body.status
  }
  row = await Game.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: row
  });
});



exports.deleteGame = asyncHandler(async (req, res, next) => {
  const row = await Game.findById(req.params.id);
  await Game.findByIdAndDelete(req.params.id);
  //await File.findByIdAndDelete(row.imageId);
  let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
  deletDiskFile(filePath);
  await PlayerPoll.deleteMany({ bannerId: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.uploadeImage = asyncHandler(async (req, res, next) => {
  // console.log('sdsdsssdsdsdsd', req.body, req.files);
  let row = await Game.findById(req.params.id);

  if (!row) {
    return next(
      new ErrorResponse(`game  not found`)
    );
  }
  if (!req.files) {
    return next(
      new ErrorResponse(`File  not uploaded`)
    );
  }
  let fieldsToUpdate;

  let filename;
  let filePath;

  if (req.files) {
    filename = '/img/gm/' + req.files.file.name;
    uploadFile(req, filename, res);
    if (req.body.col === 'package') {
      if (row.packageId) {
        filePath = path.resolve(__dirname, '../../assets/' + row.packageId);
        deletDiskFile(filePath);
      }
      fieldsToUpdate = { 'packageId': filename };

    } else if (req.body.col === 'imageId') {
      if (row.imageId) {
        filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
        deletDiskFile(filePath);
      }
      fieldsToUpdate = { 'imageId': filename };

    }
  }
  if (fieldsToUpdate) {
    row = await Game.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
  }


  res.status(200).json({
    success: true,
    data: row
  });
});



exports.getFile = asyncHandler(async (req, res, next) => {
  res.send(rec.data);

});