var express = require('express');
var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: false });

var validator = require('express-validator');

var axios = require("axios");
//var MockAdapter = require("axios-mock-adapter");

// This sets the mock adapter on the default instance
//var mock = new MockAdapter(axios);

let users = [
	{ id: 1, username: 'admin', password: '123456', email: 'admin@themesbrand.com' }
];

// // Mock GET request to /users when param `searchText` is 'John'
// mock.onGet("/users", { params: { searchText: "John" } }).reply(200, {
// 	users: users,
// });

module.exports = function (app) {

	// Inner Auth
	app.get('/auth-login', function (req, res) {
		res.locals = { title: 'Login' };
		res.render('AuthInner/auth-login');
	});
	app.get('/auth-register', function (req, res) {
		res.locals = { title: 'Register' };
		res.render('AuthInner/auth-register');
	});
	app.get('/auth-recoverpw', function (req, res) {
		res.locals = { title: 'Recover Password' };
		res.render('AuthInner/auth-recoverpw');
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
		if (req.user) { res.redirect('Dashboard/index'); }
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

		res.redirect('/');
	});


	app.get('/login', function (req, res) {
		res.render('Auth/auth-login', { 'message': req.flash('message'), 'error': req.flash('error') });
	});

	app.post('/post-login', urlencodeParser, function (req, res) {
		const validUser = users.filter(usr => usr.email === req.body.email && usr.password === req.body.password);
		axios
  .post('http://localhost:3000/api/v1/auth/login', {
    email: req.body.email,
		password:req.body.password,
  })
  .then(r => {
				// Assign value in session
				sess = req.session;
				sess.user = validUser;
				console.log(r.data)
				res.redirect('/admin/dashboard');
  //  console.log(`statusCode: ${res.statusCode}`)
  
  })
  .catch(error => {
    console.error(error)

		req.flash('error', 'Incorrect email or password!');
		res.redirect('/login');
  })
		
	 
	});

	app.get('/forgot-password', function (req, res) {
		res.render('Auth/auth-forgot-password', { 'message': req.flash('message'), 'error': req.flash('error') });
	});

	app.post('/post-forgot-password', urlencodeParser, function (req, res) {
		const validUser = users.filter(usr => usr.email === req.body.email);
		if (validUser['length'] === 1) {
			req.flash('message', 'We have e-mailed your password reset link!');
			res.redirect('/forgot-password');
		} else {
			req.flash('error', 'Email Not Found !!');
			res.redirect('/forgot-password');
		}
	});

	app.get('/logout', function (req, res) {

		// Assign  null value in session
		sess = req.session;
		sess.user = null;

		res.redirect('/login');
	});


};