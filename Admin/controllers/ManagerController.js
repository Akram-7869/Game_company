const asyncHandler = require('../middleware/async');
const {callApi} = require('../helper/common');
var apiUrl = 'http://localhost:3000/api/v1/managers/';

 
exports.listManager = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Datatables' };
    res.render('Manager/list');
});
 
 
exports.getManager = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
       callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                 
                  res.locals = { title: 'Manager' };
                  res.render('Manager/edit',{row:r.data.data}); 
            })
            .catch(error => {
                  
            })
  });
 
 
exports.updateManager = asyncHandler(async (req, res, next) => {
     
      res.locals = { title: 'Datatables' };
       callApi(req).put(apiUrl+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Manager' };
                  req.flash('message', 'Data save');
                  res.redirect('/admin/manager'); 
                
            })
            .catch(error => {
                 
  
                 req.flash('error', 'Data not updated');
               
            })
  });

 
exports.deleteManager = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl+ req.params.id)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Manager' };
            req.flash('message', 'Data save');
            res.redirect('/admin/manager'); 
          
      })
      .catch(error => {
           

           req.flash('error', 'Data not updated');
         
      })
      res.status(200).json({
        success: true,
        data: {}
      });
    });
    


 
exports.getManagers = asyncHandler(async (req, res, next) => {
      
       callApi(req).post(apiUrl, { ...req.body  } )
          .then(r => {
                // Assign value in session                
                res.status(200).json(r.data); 

          })
          .catch(error => {
                

             //   req.flash('error', 'Incorrect email or password!');
             
          })
    
    });

 
exports.addManager = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Manager' };
      res.render('Manager/add',{row:{}});
});
  
 
exports.createManagers = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Manager' };
       callApi(req).post(apiUrl+'add',req.body)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Manager-edit' };
            req.flash('success', 'Data save');
            res.redirect('/admin/manager' ); 
          
      })
      .catch(error => {
           

           req.flash('error', 'Data not updated');
         
      })
      res.render('Manager/edit',{row:{}});
});
      
exports.showManager = asyncHandler(async (req, res, next) => {
       callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                 
                  res.locals = { title: 'Manager' };
                  res.render('Manager/view',{row:r.data.data}); 
                
  
            })
            .catch(error => {
                  
  
               //   req.flash('error', 'Incorrect email or password!');
               
            })
});
 