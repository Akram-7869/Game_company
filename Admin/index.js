var app = require('express')();

var express = require('express');
var path = require('path');
var http = require('http').Server(app);
var validator = require('express-validator');

const dotenv = require('dotenv');
// Load env vars
dotenv.config({ path: './config/config.env' });

// import controller
var AuthController = require('./controllers/AuthController');

var SettingController = require('./controllers/SettingController');
// import Router file
var adminRoutes = require('./routers/admin');
var session = require('express-session');
const fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');

var flash = require('connect-flash');
var i18n = require("i18n-express");
const { siteDate, siteData } = require('./middleware/auth');


// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

//////app.use(bodyParser.json());
//var urlencodeParser = bodyParser.urlencoded({ extended: true });
//app.use(bodyParser.urlencoded({ extended: true })); 
app.use(session({
  key: 'user_sid',
  secret: 'som4erduckan4dpanelo6n9stuff0s',
  resave: false,
  saveUninitialized: false,

}));


app.use(flash());
app.use(i18n({
  translationsPath: path.join(__dirname, 'i18n'), // <--- use here. Specify translations files path.
  siteLangs: ["es", "en", "de", "ru", "it", "fr"],
  textsVarName: 'translation'
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static('public'));


app.use(SettingController.getSiteData);
// apply controller
AuthController(app);

//For set layouts of html view
var expressLayouts = require('express-ejs-layouts');
app.use(function (req, res, next) {
  req.app.locals['user'] = req.session.user;

  next();
});
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
// Define All Route 
//pageRouter(app);
app.use('/admin', adminRoutes);
app.get('/', function (req, res) {
  res.redirect('/login');
});

const PORT = process.env.PORT;

http.listen(PORT, function () {
  console.log('listening on ' + PORT);
});
