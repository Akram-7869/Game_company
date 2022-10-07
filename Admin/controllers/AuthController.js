var express = require('express');
var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: false });
const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
let apiUrl = api_url;
var validator = require('express-validator');

var axios = require("axios");


module.exports = function (app) {

	// Inner Auth
	app.get('/auth-login', function (req, res) {
		res.locals = { title: 'Login', adminUrl: process.env.ADMIN_URL };
		res.render('AuthInner/auth-login');
	});
	app.get('/auth-register', function (req, res) {
		res.locals = { title: 'Register' };
		res.render('AuthInner/auth-register');
	});
	app.get('/auth-recoverpw', function (req, res) {
		res.locals = { title: 'Recover Password' };
		res.render('Auth/auth-recoverpw', { 'message': req.flash('message'), 'error': req.flash('error') });

	});
	app.post('/post-auth-recoverpw', function (req, res) {
		console.log('posting----')
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
	app.get('/auth-lock-screen', function (req, res) {
		res.locals = { title: 'Lock Screen' };
		res.render('AuthInner/auth-lock-screen');
	});


	// Auth Pages

	app.get('/pages-maintenance', function (req, res) {
		res.locals = { title: 'Maintenance' };
		res.render('Pages/pages-maintenance');
	});
	app.get('/pages-comingsoon', function (req, res) {
		res.locals = { title: 'Coming Soon' };
		res.render('Pages/pages-comingsoon');
	});
	app.get('/pages-404', function (req, res) {
		res.locals = { title: 'Error 404' };
		res.render('Pages/pages-404');
	});
	app.get('/pages-500', function (req, res) {
		res.locals = { title: 'Error 500' };
		res.render('Pages/pages-500');
	});


	app.get('/register', function (req, res) {
		if (req.user) { res.redirect(process.env.ADMIN_URL + 'Dashboard/index'); }
		else {
			res.render('Auth/auth-register', { 'message': req.flash('message'), 'error': req.flash('error') });
		}
	});

	app.post('/post-register', urlencodeParser, function (req, res) {
		let tempUser = { username: req.body.username, email: req.body.email, password: req.body.password };
		users.push(tempUser);

		// Assign value in session
		sess = req.session;
		sess.user = tempUser;

		res.redirect(process.env.ADMIN_URL + '/');
	});


	app.get('/login', function (req, res) {
		res.locals = { title: 'Login', adminUrl: process.env.ADMIN_URL };
		res.render('Auth/auth-login', { 'message': req.flash('message'), 'error': req.flash('error') });
	});
	app.get('/page/:name', function (req, res) {
		axios.get(apiUrl + '/v1/settings/filter/page/terms', {
			email: req.body.email,
			password: req.body.password,
		})
			.then(r => {
				////console.log(r.data.data.one);
				res.render('Page/dynamic', r.data.data.one);

			}).catch(error => { })
		//	res.render('Page/dynamic', {title:'',content:''});
	});

	app.post('/post-login', urlencodeParser, function (req, res) {
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



	// app.post('/post-login', urlencodeParser, function (req, res) {
	// 	console.log(apiUrl + '/auth/login')
	// 	axios.post(apiUrl + '/auth/login', {
	// 		email: req.body.email,
	// 		password: req.body.password,
	// 	})
	// 		.then(r => {
	// 			// Assign value in session
	// 			if (!r.data.success) {
	// 				req.flash('error', 'Incorrect email or password!');
	// 				res.redirect(process.env.ADMIN_URL + '/login');
	// 				return;
	// 			}
	// 			req.session.user = r.data;
	// 			res.redirect(process.env.ADMIN_URL + '/admin/dashboard');

	// 		})
	// 		.catch(error => {

	// 		})


	// });

	app.get('/forgot-password', function (req, res) {
		res.render('Auth/auth-forgot-password', { 'message': req.flash('message'), 'error': req.flash('error') });
	});

	app.post('/post-forgot-password', urlencodeParser, function (req, res) {

		// if (validUser['length'] === 1) {
		// 	req.flash('message', 'We have e-mailed your password reset link!');
		// 	res.redirect(process.env.ADMIN_URL + '/forgot-password');
		// } else {
		// 	req.flash('error', 'Email Not Found !!');
		// 	res.redirect(process.env.ADMIN_URL + '/forgot-password');
		// }
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

	app.get('/logout', function (req, res) {

		// Assign  null value in session
		req.session.user = undefined;
		res.cookie('token', 'none', {
			expires: new Date(Date.now() + 10 * 1000),
			httpOnly: true
		});

		res.redirect(process.env.ADMIN_URL + '/login');
	});


};