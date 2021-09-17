const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
var apiUrl = api_url + '/settings/';

var axios = require("axios");
exports.pageList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page' };
      let data = { 'message': req.flash('message'), 'error': req.flash('error') };
      res.render('Page/list', data)
});
exports.getPageList = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl + 'filter/page', { ...req.body })
            .then(r => { res.status(200).json(r.data); }).catch(error => { })
});


exports.pageAdd = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page' };
      res.render('Page/add', { 'message': req.flash('message'), 'error': req.flash('error'), row: { one: { title: '', content: '' } } });
});
exports.createPage = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page' };
      req.body['type'] = 'page';
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Page' };
                  req.flash('success', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/page/');

            })
            .catch(error => {
                  req.flash('error', 'Data not updated'); res.render('Page/edit', { row: {} });
            })

});


exports.getPage = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  console.log('response', r.data.data);
                  res.locals = { title: 'Player' };
                  res.render('Page/edit', { row: r.data.data });
            })
            .catch(error => {

            })


});
exports.updatePage = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Page Term' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  res.locals = { title: 'Page ' };
                  req.flash('success', 'Updated');
                  res.redirect(process.env.ADMIN_URL + '/admin/page/');
                  return;
            }).catch(error => { })
});

exports.deletePage = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Page' };
                  req.flash('success', 'Deleted');
                  res.redirect(process.env.ADMIN_URL + '/admin/page/');

            }).catch(error => { req.flash('error', 'Data not updated'); })
      res.status(200).json({
            success: true,
            data: {}
      });
});

//payment list
exports.paymentList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Payment' };
      let data = { 'message': req.flash('message'), 'error': req.flash('error') };
      res.render('Payments/list', data)
});
exports.getPaymentList = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl + 'filter/PAYMENT', { ...req.body })
            .then(r => { res.status(200).json(r.data); }).catch(error => { })
});

//payment add

exports.addPayment = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Payment' };
      res.render('Payments/add', { 'message': req.flash('message'), 'error': req.flash('error'), row: { one: { title: '', content: '' } } });
});
exports.createPayment = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Payment' };
      req.body['type'] = 'PAYMENT';
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Payment' };
                  req.flash('success', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/payment/');

            })
            .catch(error => {
                  req.flash('error', 'Data not updated');
            })

});


exports.getPayment = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Payment' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  console.log('response', r.data.data);
                  // res.locals = { title: 'Player' };
                  res.render('Payments/edit', { row: r.data.data });
            })
            .catch(error => {

            })


});
exports.updatePayment = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Payment Term' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  res.locals = { title: 'Payment ' };
                  req.flash('success', 'Updated');
                  res.redirect(process.env.ADMIN_URL + '/admin/payment/');
                  return;
            }).catch(error => { })
});

exports.deletePayment = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Payment' };
                  req.flash('success', 'Deleted');
                  res.redirect(process.env.ADMIN_URL + '/admin/payment/');

            }).catch(error => { req.flash('error', 'Data not updated'); })
      res.status(200).json({
            success: true,
            data: {}
      });
});
//payment edit 

///////////////////////////////////////////////////////////////////

//sms list
exports.smsgatewayList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'SmsGateway' };
      let data = { 'message': req.flash('message'), 'error': req.flash('error') };
      res.render('Sms/list', data)
});
exports.getSmsGatewayList = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl + 'filter/SMSGATEWAY', { ...req.body })
            .then(r => { res.status(200).json(r.data); }).catch(error => { })
});

//sms add

exports.addSmsGateway = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'SmsGateway' };
      res.render('Sms/add', { 'message': req.flash('message'), 'error': req.flash('error'), row: { one: {} } });
});
exports.createSmsGateway = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'SmsGateway' };
      req.body['type'] = 'SMSGATEWAY';
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'SmsGateway' };
                  req.flash('success', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/smsgateway/');

            })
            .catch(error => {
                  req.flash('error', 'Data not updated'); res.render('SmsGateway/edit', { row: {} });
            })

});


exports.getSmsGateway = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'SmsGateway' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  console.log('response', r.data.data);
                  // res.locals = { title: 'Player' };
                  res.render('Sms/edit', { row: r.data.data });
            })
            .catch(error => {

            })


});
exports.updateSmsGateway = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'SmsGateway Term' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  res.locals = { title: 'SmsGateway' };
                  req.flash('success', 'Updated');
                  res.redirect(process.env.ADMIN_URL + '/admin/smsgateway/');
                  return;
            }).catch(error => { })
});

exports.deleteSmsGateway = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  res.locals = { title: 'SmsGateway' };
                  req.flash('success', 'Deleted');
                  res.redirect(process.env.ADMIN_URL + '/admin/smsgateway/');

            }).catch(error => { req.flash('error', 'Data not updated'); })
      res.status(200).json({
            success: true,
            data: {}
      });
});
//sms  
///////////////////////////////////////////////////////////////////

//SITE list
exports.siteList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'SiteGateway' };
      let data = { 'message': req.flash('message'), 'error': req.flash('error') };
      res.render('Site/list', data)
});
exports.getSiteList = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl + 'filter/SITE', { ...req.body })
            .then(r => { res.status(200).json(r.data); }).catch(error => { })
});

//site add

exports.addSite = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Site' };
      res.render('Site/add', { 'message': req.flash('message'), 'error': req.flash('error'), row: { one: {} } });
});
exports.createSite = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Site' };
      req.body['type'] = 'SITE';
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Site' };
                  req.flash('success', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/site/');

            })
            .catch(error => {
                  req.flash('error', 'Data not updated'); res.render('Site/edit', { row: {} });
            })

});


exports.getSite = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Site', apiUrl };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  console.log('response', r.data.data);
                  // res.locals = { title: 'Player' };
                  res.render('Site/edit', { row: r.data.data });
            })
            .catch(error => {

            })


});
exports.updateSite = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Site Term' };
      console.log('ddd', req.params.id, req.body);
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  res.locals = { title: 'Site' };
                  req.flash('success', 'Updated');
                  res.redirect(process.env.ADMIN_URL + '/admin/site/');
                  return;
            }).catch(error => { })
});

exports.updateSiteField = asyncHandler(async (req, res, next) => {

      console.log('ddd', req.url);
      callApi(req).post(apiUrl + 'commission/' + req.params.id, req.body)
            .then(r => {
                  res.locals = { title: 'Site' };
                  req.flash('success', 'Updated');
                  res.redirect(process.env.ADMIN_URL + '/admin/site/');
                  return;
            }).catch(error => { })
});

exports.deleteSite = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  res.locals = { title: 'Site' };
                  req.flash('success', 'Deleted');
                  res.redirect(process.env.ADMIN_URL + '/admin/site/');

            }).catch(error => { req.flash('error', 'Data not updated'); })
      res.status(200).json({
            success: true,
            data: {}
      });
});
//Site


exports.getSitelogo = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl + 'admin')
            .then(r => {
                  res.locals = { title: 'Player-edit' };
                  res.render('Settings/admin_logo', { 'message': req.flash('message'), 'error': req.flash('error'), row: r.data.data });
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
                  res.render('Settings/admin_logo', { 'message': req.flash('message'), 'error': req.flash('error'), row: r.data.data });
            })
            .catch(error => {

            })
});
exports.getSiteData = asyncHandler(async (req, res, next) => {
      //req.locals['sitename'] =
      axios.get(apiUrl + 'filter/SITE')
            .then(r => {
                  req.app.locals['sitename'] = r.data.data.one.site_name;
                  req.app.locals['siteLogoUrl'] = api_url + '/settings/image/' + r.data.data.siteLogo;
                  console.log('ddd', r.data.data);
                  res.redirect(process.env.ADMIN_URL + '/login');
            })
            .catch(error => {

            })
});