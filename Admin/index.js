const app = require('express')();
const express = require('express');
const path = require('path');
const http = require('http').Server(app);
const morgan = require('morgan');
const validator = require('express-validator');
const dotenv = require('dotenv');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const i18n = require("i18n-express");
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');


// Load env consts
dotenv.config({ path: './config/config.env' });

// Import controllers
const SettingController = require('./controllers/SettingController');

// Import router files
const indexRoutes = require('./routers/index');

// Dev logging middleware

  app.use('/public', express.static('public'));


// Enable file uploads
app.use(fileUpload({
  createParentPath: true
}));

app.use(session({
  key: 'user_sid',
  secret: 'som4erduckan4dpanelo6n9stuff0s',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000 // = 14 days in milliseconds
  }
}));
app.use(cookieParser());

app.use(flash());

app.use(i18n({
  translationsPath: path.join(__dirname, 'i18n'), // Specify translations files path.
  siteLangs: ["es", "en", "de", "ru", "it", "fr"],
  textsVarName: 'translation' // Ensure this matches the variable name in your template
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(SettingController.getSiteData);


// Set layouts of HTML view
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Define routes
app.use(indexRoutes);
 

const PORT = process.env.PORT || 3000;

http.listen(PORT, function () {
  console.log('listening on ' + PORT);
});
