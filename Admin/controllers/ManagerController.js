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
                 
                  res.locals = { title: 'Manager-edit' };
                  res.render('Manager/edit',{row:r.data.data}); 
            })
            .catch(error => {
                  
            })
  });
 
 
exports.updateManager = asyncHandler(async (req, res, next) => {
     
      res.locals = { title: 'Datatables' };
       callApi(req).post(apiUrl+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Manager-edit' };
                  req.flash('error', 'Data save');
                  res.render('Manager/edit',{row:r.data.data}); 
                
            })
            .catch(error => {
                 
  
                 req.flash('error', 'Data not updated');
               
            })
  });

 
exports.deleteManager = asyncHandler(async (req, res, next) => {
      ;
    
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
      res.locals = { title: 'Manager-edit' };
      res.render('Manager/edit',{row:{}});
});
  
 
exports.createManagers = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Manager-edit' };
       callApi(req).post(apiUrl,req.body)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Manager-edit' };
            req.flash('success', 'Data save');
            res.render('Manager/edit',{row:r.data.data}); 
          
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
                 
                  res.locals = { title: 'Manager-edit' };
                  res.render('Manager/view',{row:r.data.data}); 
                
  
            })
            .catch(error => {
                  
  
               //   req.flash('error', 'Incorrect email or password!');
               
            })
});
 