const asyncHandler = require('../middleware/async');
const {callApi} = require('../helper/common');
var apiUrl = 'http://localhost:3000/api/v1/versions/';

 
exports.listVersion = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Verson Controle' };
    res.render('Version/list');
});
 
 
exports.getVersion = asyncHandler(async (req, res, next) => {
      res.locals = { title:  'Verson Controle'  };
       callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                 console.log('dddddd',r.data.data);
                  res.locals = { title: 'Version-edit' };
                  res.render('Version/edit',{row:r.data.data}); 
            })
            .catch(error => {
                  console.error(error.error);
            })
  });
 
 
exports.updateVersion = asyncHandler(async (req, res, next) => {
      console.log('kamleshshsh',req.body,'query',req.query)
      res.locals = { title:  'Verson Controle'  };
       callApi(req).post(apiUrl+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Version-edit' };
                  req.flash('error', 'Data save');
                  res.render('Version/edit',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
            })
            .catch(error => {
                  console.log(error)
  
                 req.flash('error', 'Data not updated');
                //  res.redirect('/login');
            })
  });

 
exports.deleteVersion = asyncHandler(async (req, res, next) => {
      console.log('del',req.params.id);
    
      res.status(200).json({
        success: true,
        data: {}
      });
    });
    


 
exports.getVersions = asyncHandler(async (req, res, next) => {
      console.log('qwwwwwe',req.body);
       callApi(req).post(apiUrl, { ...req.body  } )
          .then(r => {
                // Assign value in session
                console.log('tlist', r.data)
                
                res.status(200).json(r.data);
                 
                //  console.log(`statusCode: ${res.statusCode}`)

          })
          .catch(error => {
                console.log(error.error)

             //   req.flash('error', 'Incorrect email or password!');
              //  res.redirect('/login');
          })
    
    });

 
exports.addVersion = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Version' };
     
      res.render('Version/add',{row:{}});
});
  
 
exports.createVersions = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Version-add' };
       callApi(req).post(apiUrl+'add',req.body)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Version-edit' };
            req.flash('success', 'Data save');
            res.render('Version/edit',{row:r.data.data}); 
            //  console.log(`statusCode: ${res.statusCode}`)
      })
      .catch(error => {
            console.log(error)

           req.flash('error', 'Data not updated');
          //  res.redirect('/login');
      })
      res.render('Version/edit',{row:{}});
});
      
exports.showVersion = asyncHandler(async (req, res, next) => {
       callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                 console.log('dddddd',r.data.data);
                  res.locals = { title: 'Version-edit' };
                  res.render('Version/view',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
  
            })
            .catch(error => {
                  console.error(error.error)
  
               //   req.flash('error', 'Incorrect email or password!');
                //  res.redirect('/login');
            })
});
 