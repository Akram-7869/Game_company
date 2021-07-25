const asyncHandler = require('../middleware/async');
const {callApi} = require('../helper/common');
var apiUrl = 'http://localhost:3000/api/v1/settings/';

exports.settingList = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Datatables' };
    res.render('Settings/list',{apiUrl})
});
 
 
exports.getSetting = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                 console.log('dddddd',r.data.data);
                  res.locals = { title: 'Player-edit' };
                  res.render('Settings/edit',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            })
            .catch(error => {
                  console.error(error.error);
            })
  });
 
 
exports.updateSetting = asyncHandler(async (req, res, next) => {
      console.log('kamleshshsh',req.body,'query',req.query)
      res.locals = { title: 'Datatables' };
      callApi(req).post(apiUrl+ req.params.id,req.body)
            .then(r => {
                  console.log('response',r);
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('message', 'Data save');
                res.render('Settings/edit',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
                  //res.render('Settings/edit',{row:r.data.data});
                 // res.redirect('/admin/settings/'+ req.params.id); 
                  //  console.log(`statusCode: ${res.statusCode}`)
            })
            .catch(error => {
                  console.log(error)
  
                 req.flash('error', 'Data not updated');
                //  res.redirect('/login');
            })
  });

 
exports.deleteSetting = asyncHandler(async (req, res, next) => {
      console.log('del',req.params.id);
    
      res.status(200).json({
        success: true,
        data: {}
      });
    });
    


 
exports.getSettings = asyncHandler(async (req, res, next) => {
      console.log('call server',req.body, apiUrl);
      callApi(req).post(apiUrl, { ...req.body  } )
          .then(r => {
                 console.log('list', r.data)
                res.status(200).json(r.data);
          })
          .catch(error => {
                console.log(error.error)

             //   req.flash('error', 'Incorrect email or password!');
              //  res.redirect('/login');
          })
    
    });

 
exports.settingAdd = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting-add' };
     
      res.render('Settings/edit',{ 'message': req.flash('message'), 'error': req.flash('error'),row:{}});
});
  
 
exports.createSettings = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
      callApi(req).post(apiUrl,req.body)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Player-edit' };
            req.flash('success', 'Data save');
            res.render('Settings/edit',{row:r.data.data}); 
            //  console.log(`statusCode: ${res.statusCode}`)
      })
      .catch(error => {
            console.log(error)

           req.flash('error', 'Data not updated');
          //  res.redirect('/login');
      })
      res.render('Settings/edit',{row:{}});
});