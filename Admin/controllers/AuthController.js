var express = require('express');
var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
const querystring = require('querystring');

let apiUrl = api_url;
var validator = require('express-validator');

var axios = require("axios");
exports.login = asyncHandler(async (req, res, next) => {
	//app.get('/login', function (req, res) {
	res.locals = { title: 'Login', adminUrl: process.env.ADMIN_URL };
	res.render('Auth/auth-login', { 'message': req.flash('message'), 'error': req.flash('error') });
	//});
});

exports.postLogin = asyncHandler(async (req, res, next) => {
	axios.post(apiUrl + '/auth/login', {
		email: req.body.email,
		password: req.body.password,
	})
		.then(r => {
			// Assign value in session
			if (!r.data.success) {
				req.flash('error', 'Incorrect email or password!');
				res.redirect(process.env.ADMIN_URL + '/login');
				return;
			}
			req.session.user = r.data;
			//req.app.locals['user'] = r.data;
			res.redirect(process.env.ADMIN_URL + '/admin/dashboard');

		})
		.catch(error => {

		})


});
exports.forgotPassword = asyncHandler(async (req, res, next) => {
	res.render('Auth/auth-forgot-password', { 'message': req.flash('message'), 'error': req.flash('error') });

});
exports.postForgotPassword = asyncHandler(async (req, res, next) => {

	axios.post(apiUrl + '/auth/forgotpassword', {
		email: req.body.email,
		phone: req.body.phone
	})
		.then(r => {
			if (!r.data.success) {
				req.flash('error', r.data.error);
				res.redirect(process.env.ADMIN_URL + '/forgot-password');

			} else {
				// Assign value in session
				req.flash('message', 'otp sent');
				res.redirect(process.env.ADMIN_URL + '/auth-recoverpw');
			}

		})
		.catch(error => {
			console.log('error', error);
		})




});
exports.authRecoverpw = asyncHandler(async (req, res, next) => {
	res.locals = { title: 'Recover Password' };
	res.render('Auth/auth-recoverpw', { 'message': req.flash('message'), 'error': req.flash('error') });


});
exports.postAuthRecoverpw = asyncHandler(async (req, res, next) => {
	//console.log('posting----')
	res.locals = { title: 'Recover Password' };
	axios.post(apiUrl + '/auth/resetpassword', {
		npassword: req.body.npassword,
		phone: req.body.phone,
		otp: req.body.otp
	})
		.then(r => {
			if (!r.data.success) {
				req.flash('error', r.data.error);
				res.redirect(process.env.ADMIN_URL + '/auth-recoverpw');

			} else {

				req.flash('message', 'Password Changed Successfully');
				res.redirect(process.env.ADMIN_URL + '/');
			}
			// Assign value in session



		})
		.catch(error => {
			// req.flash('error', 'Email Not Found !!');
			// res.redirect(process.env.ADMIN_URL + '/forgot-password');
		})
	//res.render('Auth/auth-recoverpw', { 'message': req.flash('message'), 'error': req.flash('error') });



});
exports.logout = asyncHandler(async (req, res, next) => {
	// Assign  null value in session
	req.session.user = undefined;
	res.cookie('token', 'none', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true
	});
	res.redirect(process.env.ADMIN_URL + '/login');
});



exports.page = asyncHandler(async (req, res, next) => {
	axios.get(apiUrl + '/v1/settings/filter/page/terms')
		.then(r => {
			res.render('Page/dynamic', r.data.data.one);
		}).catch(error => { })
});
exports.authRegister = asyncHandler(async (req, res, next) => {
	res.locals = { title: 'Register' };
	res.render('Auth/auth-register', { 'message': req.flash('message'), 'error': req.flash('error') });


});
exports.postRegister = asyncHandler(async (req, res, next) => {
	axios.post(apiUrl + '/auth/register', {
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		phone: req.body.phone,
		// country: req.body.country,
		// state: req.body.state,
		// city: req.body.city,


		type: req.body.type,

	})
		.then(r => {
			// Assign value in session
			if (!r.data.success) {
				req.flash('error', 'Incorrect email or password!');
				res.redirect(process.env.ADMIN_URL + '/login');
				return;
			}
			req.session.user = r.data;
			//req.app.locals['user'] = r.data;
			res.redirect(process.env.ADMIN_URL + '/admin/dashboard');

		})
		.catch(error => {

		})



});
// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '514412197159-hh4og8hglvjr4kc4b60chpd8p19ku0g5.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const GOOGLE_REDIRECT_URI = 'http://localhost:8000/google/callback';

// Google Auth
exports.getGoogle = asyncHandler(async (req, res, next) =>{
  const scope = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ');
  
 let   accountType= req.query.accountType || 'infulencer'

  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&scope=${scope}&state=${accountType}`;

  res.redirect(url);
});
exports.googleCallback = asyncHandler(async (req, res, next) => {
		const { code, state} = req.query;
	  
		try {
		  // Exchange code for access token
		  const { data } = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
			code,
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			redirect_uri: GOOGLE_REDIRECT_URI,
			grant_type: 'authorization_code'
		  }));
	  
		  const { access_token } = data;
	  
		  // Fetch user information
		  const { data: userInfo } = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`);
	  
		  const { id: googleId, email } = userInfo;
		  console.log(userInfo,state);
	  
		  // let user = await User.findOne({ googleId });
	  
		  // if (user) {
		  //   // User exists
		  //   req.session.userId = user._id;
		  //   req.flash('success_msg', 'You are logged in');
		  //   res.redirect('/dashboard');
		  // } else {
		  //   // Create new user
		  //   user = new User({
		  //     googleId,
		  //     email,
		  //     accountType: 'type1', // or 'type2', depending on your logic
		  //   });
	  
		  //   await user.save();
	  
		  //   req.session.userId = user._id;
		  //   req.flash('success_msg', 'You are now registered and logged in');
		  //   res.redirect('/dashboard');
		  // }
		} catch (err) {
		  console.error(err);
		  req.flash('error_msg', 'Something went wrong');
		  res.redirect('/auth/login');
		}
	  
	axios.post(apiUrl + '/auth/register', {
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		phone: req.body.phone,
		// country: req.body.country,
		// state: req.body.state,
		// city: req.body.city,


		type: req.body.type,

	})
		.then(r => {
			// Assign value in session
			if (!r.data.success) {
				req.flash('error', 'Incorrect email or password!');
				res.redirect(process.env.ADMIN_URL + '/login');
				return;
			}
			req.session.user = r.data;
			//req.app.locals['user'] = r.data;
			res.redirect(process.env.ADMIN_URL + '/admin/dashboard');

		})
		.catch(error => {

		})



});
// module.exports = function (app) {

// 	// Inner Auth
// 	app.get('/auth-login', function (req, res) {
// 		res.locals = { title: 'Login', adminUrl: process.env.ADMIN_URL };
// 		res.render('AuthInner/auth-login');
// 	});
// 	app.get('/auth-register', function (req, res) {
// 		res.locals = { title: 'Register' };
// 		res.render('AuthInner/auth-register');
// 	});
// 	app.get('/auth-recoverpw', function (req, res) {
// 		res.locals = { title: 'Recover Password' };
// 		res.render('Auth/auth-recoverpw', { 'message': req.flash('message'), 'error': req.flash('error') });

// 	});
// 	app.post('/post-auth-recoverpw', function (req, res) {
// 		console.log('posting----')
// 		res.locals = { title: 'Recover Password' };
// 		axios.post(apiUrl + '/auth/resetpassword', {
// 			npassword: req.body.npassword,
// 			phone: req.body.phone,
// 			otp: req.body.otp
// 		})
// 			.then(r => {
// 				if (!r.data.success) {
// 					req.flash('error', r.data.error);
// 					res.redirect(process.env.ADMIN_URL + '/auth-recoverpw');

// 				} else {

// 					req.flash('message', 'Password Changed Successfully');
// 					res.redirect(process.env.ADMIN_URL + '/');
// 				}
// 				// Assign value in session



// 			})
// 			.catch(error => {
// 				// req.flash('error', 'Email Not Found !!');
// 				// res.redirect(process.env.ADMIN_URL + '/forgot-password');
// 			})
// 		//res.render('Auth/auth-recoverpw', { 'message': req.flash('message'), 'error': req.flash('error') });

// 	});
// 	app.get('/auth-lock-screen', function (req, res) {
// 		res.locals = { title: 'Lock Screen' };
// 		res.render('AuthInner/auth-lock-screen');
// 	});


// 	// Auth Pages

// 	app.get('/pages-maintenance', function (req, res) {
// 		res.locals = { title: 'Maintenance' };
// 		res.render('Pages/pages-maintenance');
// 	});
// 	app.get('/pages-comingsoon', function (req, res) {
// 		res.locals = { title: 'Coming Soon' };
// 		res.render('Pages/pages-comingsoon');
// 	});
// 	app.get('/pages-404', function (req, res) {
// 		res.locals = { title: 'Error 404' };
// 		res.render('Pages/pages-404');
// 	});
// 	app.get('/pages-500', function (req, res) {
// 		res.locals = { title: 'Error 500' };
// 		res.render('Pages/pages-500');
// 	});


// 	app.get('/register', function (req, res) {
// 		if (req.user) { res.redirect(process.env.ADMIN_URL + 'Dashboard/index'); }
// 		else {
// 			res.render('Auth/auth-register', { 'message': req.flash('message'), 'error': req.flash('error') });
// 		}
// 	});

// 	app.post('/post-register', urlencodeParser, function (req, res) {
// 		let tempUser = { username: req.body.username, email: req.body.email, password: req.body.password };
// 		users.push(tempUser);

// 		// Assign value in session
// 		sess = req.session;
// 		sess.user = tempUser;

// 		res.redirect(process.env.ADMIN_URL + '/');
// 	});


// 	app.get('/login', function (req, res) {
// 		res.locals = { title: 'Login', adminUrl: process.env.ADMIN_URL };
// 		res.render('Auth/auth-login', { 'message': req.flash('message'), 'error': req.flash('error') });
// 	});
// 	app.get('/page/:name', function (req, res) {
// 		axios.get(apiUrl + '/v1/settings/filter/page/terms', {
// 			email: req.body.email,
// 			password: req.body.password,
// 		})
// 			.then(r => {
// 				////console.log(r.data.data.one);
// 				res.render('Page/dynamic', r.data.data.one);

// 			}).catch(error => { })
// 		//	res.render('Page/dynamic', {title:'',content:''});
// 	});

// 	app.post('/post-login', urlencodeParser, function (req, res) {
// 		axios.post(apiUrl + '/auth/login', {
// 			email: req.body.email,
// 			password: req.body.password,
// 		})
// 			.then(r => {
// 				// Assign value in session
// 				if (!r.data.success) {
// 					req.flash('error', 'Incorrect email or password!');
// 					res.redirect(process.env.ADMIN_URL + '/login');
// 					return;
// 				}
// 				req.session.user = r.data;
// 				//req.app.locals['user'] = r.data;
// 				res.redirect(process.env.ADMIN_URL + '/admin/dashboard');

// 			})
// 			.catch(error => {

// 			})


// 	});



// 	// app.post('/post-login', urlencodeParser, function (req, res) {
// 	// 	console.log(apiUrl + '/auth/login')
// 	// 	axios.post(apiUrl + '/auth/login', {
// 	// 		email: req.body.email,
// 	// 		password: req.body.password,
// 	// 	})
// 	// 		.then(r => {
// 	// 			// Assign value in session
// 	// 			if (!r.data.success) {
// 	// 				req.flash('error', 'Incorrect email or password!');
// 	// 				res.redirect(process.env.ADMIN_URL + '/login');
// 	// 				return;
// 	// 			}
// 	// 			req.session.user = r.data;
// 	// 			res.redirect(process.env.ADMIN_URL + '/admin/dashboard');

// 	// 		})
// 	// 		.catch(error => {

// 	// 		})


// 	// });

// 	app.get('/forgot-password', function (req, res) {
// 		res.render('Auth/auth-forgot-password', { 'message': req.flash('message'), 'error': req.flash('error') });
// 	});

// 	app.post('/post-forgot-password', urlencodeParser, function (req, res) {

// 		// if (validUser['length'] === 1) {
// 		// 	req.flash('message', 'We have e-mailed your password reset link!');
// 		// 	res.redirect(process.env.ADMIN_URL + '/forgot-password');
// 		// } else {
// 		// 	req.flash('error', 'Email Not Found !!');
// 		// 	res.redirect(process.env.ADMIN_URL + '/forgot-password');
// 		// }
// 		axios.post(apiUrl + '/auth/forgotpassword', {
// 			email: req.body.email,
// 			phone: req.body.phone
// 		})
// 			.then(r => {
// 				if (!r.data.success) {
// 					req.flash('error', r.data.error);
// 					res.redirect(process.env.ADMIN_URL + '/forgot-password');

// 				} else {
// 					// Assign value in session
// 					req.flash('message', 'otp sent');
// 					res.redirect(process.env.ADMIN_URL + '/auth-recoverpw');
// 				}

// 			})
// 			.catch(error => {
// 				console.log('error', error);
// 			})
// 	});

// 	app.get('/logout', function (req, res) {

// 		// Assign  null value in session
// 		req.session.user = undefined;
// 		res.cookie('token', 'none', {
// 			expires: new Date(Date.now() + 10 * 1000),
// 			httpOnly: true
// 		});

// 		res.redirect(process.env.ADMIN_URL + '/login');
// 	});


// };