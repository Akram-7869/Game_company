const asyncHandler = require('../middleware/async');
const {callApi} = require('../helper/common');
var apiUrl = 'http://localhost:3000/api/v1/settings/';

// exports.settingList = asyncHandler(async (req, res, next) => {
//     res.locals = { title: 'Datatables' };
//     res.render('Settings/list',{apiUrl})
// });
exports.getPageAbout = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page Aboutus' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Page' };
                  res.render('Page/aboutus',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updatePageAbout = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page Aboutus' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                  res.locals = { title: 'Page' };
                  res.render('Page/aboutus',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });

  exports.getPageTerm = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page Term' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Page ' };
                  res.render('Page/term',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updatePageTerm = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page Term' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Page ' };
                  res.render('Page/term',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.getPagePolicy = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page Policy' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Page ' };
                  res.render('Page/policy',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updatePagePolicy = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page Policy' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Page ' };
                  res.render('Page/policy',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });



exports.getLocalText = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Setting' };
                  res.render('Settings/sms_localtext',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updateLocalText = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Setting' };
                  res.render('Settings/sms_localtext',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
exports.getMessageSetting = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Setting' };
                  res.render('Settings/sms_message',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updateMessageSetting = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Setting' };
                  res.render('Settings/sms_message',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
exports.getPayuMoney = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Setting' };
                  res.render('Settings/payment_payumoney',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updatePayuMoney = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Setting' };
                  res.render('Settings/payment_payumoney',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
exports.getRazorPay = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Setting' };
                  res.render('Settings/payment_razorpay',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updateRazorPay = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Setting' };
                  res.render('Settings/payment_razorpay',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
exports.getCashfree = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting Cashfree' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Setting Cashfree'};
                  res.render('Settings/payment_cashfree',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updateCashFree = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting Cashfree' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Setting' };
                  res.render('Settings/payment_cashfree',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });

exports.get2stepAuth = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Setting' };
                  res.render('Settings/admin_2stepauth',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.update2stepAuth = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Setting' };
                  res.render('Settings/admin_2stepauth',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
exports.getFireBase = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Setting' };
                  res.render('Settings/admin_firebase',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });
  exports.updateFireBase = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Setting' };
                  res.render('Settings/admin_firebase',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            }).catch(error => {})
  });

exports.getSiteSupportEmail = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Setting' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Setting' };
                  res.render('Settings/admin_supportemail',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            })
            .catch(error => {
                  
            })
  });
  exports.updateSiteSupportEmail = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Setting' };
                  res.render('Settings/admin_supportemail',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            })
            .catch(error => {
                  
            })
  });
 
exports.getSitelogo = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Player-edit' };
                  res.render('Settings/admin_logo',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            })
            .catch(error => {
                  
            })
  });
  exports.updateSitelogo = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Player-edit' };
                  res.render('Settings/admin_logo',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            })
            .catch(error => {
                  
            })
  });
exports.getSitename = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                 
                  res.locals = { title: 'Player-edit' };
                  res.render('Settings/admin_sitename',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            })
            .catch(error => {
                  
            })
  });
  exports.updateSitename = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + 'admin', req.body)
            .then(r => {
                 
                  res.locals = { title: 'Player-edit' };
                  res.render('Settings/admin_sitename',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            })
            .catch(error => {
                  
            })
  });
exports.getSetting = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                 
                  res.locals = { title: 'Player-edit' };
                  res.render('Settings/edit',{  'message': req.flash('message'), 'error': req.flash('error'),row:r.data.data }); 
            })
            .catch(error => {
                  
            })
  });
 
 
exports.updateSetting = asyncHandler(async (req, res, next) => {
     
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
                
            })
            .catch(error => {
                 
  
                 req.flash('error', 'Data not updated');
               
            })
  });

 
exports.deleteSetting = asyncHandler(async (req, res, next) => {
      ;
    
      res.status(200).json({
        success: true,
        data: {}
      });
    });
    


 
exports.getSettings = asyncHandler(async (req, res, next) => {
      console.log('call server',req.body, apiUrl);
      callApi(req).post(apiUrl, { ...req.body  } )
          .then(r => {
                 
                res.status(200).json(r.data);
          })
          .catch(error => {
                

             //   req.flash('error', 'Incorrect email or password!');
             
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
          
      })
      .catch(error => {
           

           req.flash('error', 'Data not updated');
         
      })
      res.render('Settings/edit',{row:{}});
});