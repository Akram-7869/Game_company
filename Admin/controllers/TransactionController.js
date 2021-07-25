const asyncHandler = require('../middleware/async');
const {callApi} = require('../helper/common');
var apiUrl = 'http://localhost:3000/api/v1/transactions/';

 
exports.transcationList = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Datatables' };
    res.render('Transaction/list');
});
 
 
exports.getTransaction = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
       callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                 
                  res.locals = { title: 'Player-edit' };
                  res.render('Transaction/edit',{row:r.data.data}); 
            })
            .catch(error => {
                  
            })
  });
 
 
exports.updatePlayer = asyncHandler(async (req, res, next) => {
     
      res.locals = { title: 'Datatables' };
       callApi(req).post(apiUrl+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('error', 'Data save');
                  res.render('Transaction/edit',{row:r.data.data}); 
                
            })
            .catch(error => {
                 
  
                 req.flash('error', 'Data not updated');
               
            })
  });

 
exports.deletePlayer = asyncHandler(async (req, res, next) => {
      ;
    
      res.status(200).json({
        success: true,
        data: {}
      });
    });
    


 
exports.getTranscations = asyncHandler(async (req, res, next) => {
      
       callApi(req).post(apiUrl, { ...req.body  } )
          .then(r => {
                // Assign value in session
                
                
                res.status(200).json(r.data);
                 
              

          })
          .catch(error => {
                

             //   req.flash('error', 'Incorrect email or password!');
             
          })
    
    });

 
exports.getAddForm = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
     
      res.render('Transaction/edit',{row:{}});
});
  
 
exports.createPlayers = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
       callApi(req).post(apiUrl,req.body)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Player-edit' };
            req.flash('success', 'Data save');
            res.render('Transaction/edit',{row:r.data.data}); 
          
      })
      .catch(error => {
           

           req.flash('error', 'Data not updated');
         
      })
      res.render('Transaction/edit',{row:{}});
});
      
exports.showPlayerView = asyncHandler(async (req, res, next) => {
       callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                 
                  res.locals = { title: 'Player-edit' };
                  res.render('Transaction/view',{row:r.data.data}); 
                
  
            })
            .catch(error => {
                  
  
               //   req.flash('error', 'Incorrect email or password!');
               
            })
});
 