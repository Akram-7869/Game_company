const asyncHandler = require('../middleware/async');
var axios = require("axios");
var apiUrl = 'http://localhost:3000/api/v1/banner/';


exports.bannerList = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Banner' };
    res.render('Ads/list')
});
 
 
exports.getBanner = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner' };
      axios.get(apiUrl + req.params.id)
            .then(r => {
                  res.locals = { title: 'Banner' };
                  res.render('Ads/edit',{row:r.data.data}); 
            })
            .catch(error => {
                  
            })
  });
 
 
exports.updateBanner = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner' };
      axios.post(apiUrl+ req.params.id,req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Banner' };
                  req.flash('error', 'Data save');
                  res.render('Ads/edit',{row:r.data.data}); 
            })
            .catch(error => {
  
                 req.flash('error', 'Data not updated');
               
            })
  });

 
exports.deleteBanner = asyncHandler(async (req, res, next) => {
    
      res.status(200).json({
        success: true,
        data: {}
      });
    });
    


 
exports.getBanners = asyncHandler(async (req, res, next) => {
      axios.post(apiUrl, { ...req.body  } )
          .then(r => {
                // Assign value in session
                
                res.status(200).json(r.data);
                 

          })
          .catch(error => {

             //   req.flash('error', 'Incorrect email or password!');
             
          })
    
    });

 
exports.bannerAdd = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner' };
     
      res.render('Ads/add',{row:{}});
});
  
 
exports.createBanners = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner' };
     console.log('creating-image', req.files,req.body);
     axios.post(apiUrl+'uplodfile',{ file:req.files},{'maxContentLength': Infinity,
     'maxBodyLength': Infinity}).then(r=>{
           console.log('rrrr',r)
     });
      axios.post(apiUrl,{body:req.body, file:req.files})
      .then(r => {
            // Assign value in session
            res.locals = { title: 'Banner' };
            req.flash('success', 'Data save');
            res.render('Ads/edit',{row:r.data.data}); 
          
      })
      .catch(error => {
        //   

           req.flash('error', 'Data not updated');
         
      })
       res.render('Ads/list',{row:{}});
});
      
// exports.showPlayerView = asyncHandler(async (req, res, next) => {
//       axios.get(apiUrl + req.params.id)
//             .then(r => {
//                   // Assign value in session
//                  
//                   res.locals = { title: 'Banner' };
//                   res.render('Ads/view',{row:r.data.data}); 
//                 
  
//             })
//             .catch(error => {
//                   
  
//                //   req.flash('error', 'Incorrect email or password!');
//                
//             })
// });
 