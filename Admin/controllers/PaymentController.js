const asyncHandler = require('../middleware/async');
var axios = require("axios");
var apiUrl = 'http://localhost:3000/api/v1/transaction/';

 
exports.transcationList = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Datatables' };
    res.render('Players/list')
});
 
 
exports.getTransaction = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      axios.get(apiUrl + req.params.id)
            .then(r => {
                 
                  res.locals = { title: 'Player-edit' };
                  res.render('Players/edit',{row:r.data.data}); 
            })
            .catch(error => {
                  
            })
  });
 
 
exports.updatePlayer = asyncHandler(async (req, res, next) => {
     
      res.locals = { title: 'Datatables' };
      axios.post(apiUrl+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('error', 'Data save');
                  res.render('Players/edit',{row:r.data.data}); 
                
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
      
      axios.post(apiUrl, { ...req.body  } )
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
     
      res.render('Players/edit',{row:{}});
});
  
 
exports.createPlayers = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
      axios.post(apiUrl,req.body)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Player-edit' };
            req.flash('success', 'Data save');
            res.render('Players/edit',{row:r.data.data}); 
          
      })
      .catch(error => {
           req.flash('error', 'Data not updated');
      })
      res.render('Players/edit',{row:{}});
});
      
exports.showPlayerView = asyncHandler(async (req, res, next) => {
      axios.get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                 
                  res.locals = { title: 'Player-edit' };
                  res.render('Players/view',{row:r.data.data}); 
                
  
            })
            .catch(error => {
                  
  
               //   req.flash('error', 'Incorrect email or password!');
               
            })
});
 
