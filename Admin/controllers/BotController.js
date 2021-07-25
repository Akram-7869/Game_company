const asyncHandler = require('../middleware/async');
const {callApi} = require('../helper/common');
var apiUrl = 'http://localhost:3000/api/v1/bots/';

 
exports.listBot = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Bot Controle' };
    res.render('Bot/list');
});
 
 
exports.getBot = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Bot Controle' };
       callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                 console.log('dddddd',r.data.data);
                  res.locals = { title: 'Bot' };
                  res.render('Bot/edit',{row:r.data.data}); 
            })
            .catch(error => {
                  console.error(error.error);
            })
  });
 
 
exports.updateBot = asyncHandler(async (req, res, next) => {
      console.log('kamleshshsh',req.body,'query',req.query)
      res.locals = { title: 'Bot Controle' };
       callApi(req).post(apiUrl+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Bot' };
                  req.flash('error', 'Data save');
                  res.render('Bot/edit',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
            })
            .catch(error => {
                  console.log(error)
  
                 req.flash('error', 'Data not updated');
                //  res.redirect('/login');
            })
  });

 
exports.deleteBot = asyncHandler(async (req, res, next) => {
      console.log('del',req.params.id);
    
      res.status(200).json({
        success: true,
        data: {}
      });
    });
    


 
exports.getBots = asyncHandler(async (req, res, next) => {
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

 
exports.addBot = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Bot' };
     
      res.render('Bot/add',{row:{}});
});
  
 
exports.createBots = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Bot' };
       callApi(req).post(apiUrl+'add',req.body)
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Bot' };
            req.flash('success', 'Data save');
            res.render('Bot/edit',{row:r.data.data}); 
            //  console.log(`statusCode: ${res.statusCode}`)
      })
      .catch(error => {
            console.log(error)

           req.flash('error', 'Data not updated');
          //  res.redirect('/login');
      })
      res.render('Bot/edit',{row:{}});
});
      
exports.showBotView = asyncHandler(async (req, res, next) => {
       callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                 console.log('dddddd',r.data.data);
                  res.locals = { title: 'Bot' };
                  res.render('Bot/view',{row:r.data.data}); 
                  //  console.log(`statusCode: ${res.statusCode}`)
  
            })
            .catch(error => {
                  console.error(error.error)
  
               //   req.flash('error', 'Incorrect email or password!');
                //  res.redirect('/login');
            })
});
 