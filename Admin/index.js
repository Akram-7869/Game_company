const app = require('express')();

const express = require('express');
const path = require('path');
const http = require('http').Server(app);
const morgan = require('morgan');
const validator = require('express-validator');

const dotenv = require('dotenv');
// Load env consts
dotenv.config({ path: './config/config.env' });

// import controller

const SettingController = require('./controllers/SettingController');
// import Router file
const adminRoutes = require('./routers/admin');
const influencerRoutes = require('./routers/influencer');

const siteRoutes = require('./routers/site');

const session = require('express-session');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

const flash = require('connect-flash');
const i18n = require("i18n-express");
 
// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
 // app.use(morgan('dev'));
  app.use('/public', express.static('public'));

}
// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

//////app.use(bodyParser.json());
//const urlencodeParser = bodyParser.urlencoded({ extended: true });
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
  textsconstName: 'translation'
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(SettingController.getSiteData);
 app.use('/', siteRoutes);
//For set layouts of html view
const expressLayouts = require('express-ejs-layouts');
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
// Define All Route 
//pageRouter(app);
app.use('/admin', adminRoutes);
app.use('/influencer', influencerRoutes);



const PORT = process.env.PORT;

http.listen(PORT, function () {
  console.log('listening on ' + PORT);
});
