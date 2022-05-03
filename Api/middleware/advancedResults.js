const Player = require("../models/Player");
var mongoose = require('mongoose');
 
exports.advancedResults = (model, populate, filter = {}) => async (req, res, next) => {
  let query;

  // Copy req.query
  let reqQuery = { ...req.query };

  if (reqQuery['q']) {
    reqQuery['title'] = { $regex: reqQuery.q, $options: 'i' };
  }
  // if (!req.user) {
  //   reqQuery['groupId'] = req.defaultGroup._id;
  //   reqQuery = { ...reqQuery, ...filter }
  // } else {
  //   reqQuery['groupId'] = req.user.selectedGroup;
  //   delete reqQuery.public
  // }

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit', 'q'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);
  if (reqQuery['quizCategory']) {
    reqQuery['quizCategory']['in'] = reqQuery['quizCategory']['in'].split(',')
  }

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // console.log(queryStr, req.user);
  // Finding resource
  query = model.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {

    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};


exports.ownResults = (model, populate, filter = '') => async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };
  if (reqQuery['title']) {
    reqQuery['title'] = "/${reqQuery.q}/";
  }
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit', 'q'];

  // // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);
  // if (!req.user) {
  //   reqQuery['groupId'] = req.defaultGroup;
  // } else {
  //   if (req.user.role === 'author') {
  //     //own
  //     if (filter == 'my')
  //       reqQuery['createdBy'] = req.user._id;
  //   }

  //   if (req.user.role !== 'superadmin') {
  //     //users in multiple organization
  //     if (filter === 'in') {
  //       reqQuery['groupId'] = { 'in': [req.user.selectedGroup] }
  //     }
  //     else {
  //       //entity of organization
  //       reqQuery['groupId'] = req.user.selectedGroup;
  //     }
  //   }
  // }
console.log('oooo',req.user)
  if (req.user.role == 'user') {
    //own
    reqQuery['user'] = req.user._id;
  }



  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);


  // Finding resource
  query = model.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }
  console.log('own', queryStr);
  // Executing query
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};
exports.userResults = (model, populate, filter = '') => async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };
  if (reqQuery['title']) {
    reqQuery['title'] = "/${reqQuery.q}/";
  }
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit', 'q'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

let hideRole =["superadmin"];
  reqQuery['role']={"$nin":hideRole };
  if (!req.user) {
    reqQuery['groupId'] = req.defaultGroup;
  } else {
    if (req.user.role === 'author') {
      //own
      if (filter == 'my') {
        reqQuery['createdBy'] = req.user._id;
      }

      reqQuery['role'] = 'user';
    }

    if (req.user.role != 'superadmin') {
      //users in multiple organization
      if (filter === 'in') {
        reqQuery['groupId'] = { 'in': [req.user.selectedGroup] }
      }
      else {
        //entity of organization
        //var mongoObjectId = new mongoose.Types.ObjectId(req.user.selectedGroup);
        // console.log('iii', mongoObjectId, req.user.selectedGroup);
        //reqQuery['groupId._id'] = mongoose.Types.ObjectId(req.user.selectedGroup);
      }
    }
  }

  // if (req.user.role == 'admin') {
  //   //own
    
  //   reqQuery['role'] =hideRole;
  // }



  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  let sql = JSON.parse(queryStr);
  //do not change JSON.parse(queryStr) not working
  if (req.user.role === 'admin') {
    sql = { "groupId._id": req.user.selectedGroup }
  } else if (req.user.role === 'teacher') {
    sql = { 'groupId._id': req.user.selectedGroup, role: 'student',"createdBy":req.user._id }
  } else if (req.user.role === 'author') {
    sql = { 'groupId._id': req.user.selectedGroup, role: 'user' }
  }

  // Finding resource
  query = model.find(sql);

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate({
      path: 'groupId._id', model: 'Group', select: 'name type',

    });
  }
  console.log('own', sql);
  // Executing query
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};
exports.defaultResults =  (model, populate) => async (req, res, next) => {
  let query;
 
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];
 
  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  query = model.find(JSON.parse(queryStr));
 
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};
 
