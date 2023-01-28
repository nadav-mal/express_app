/* testing */
const path = require('path');

const express = require('express');
const cookieParser= require('cookie-parser')
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');


// load the routes
const adminRoutes = require('./routes/admin');
const loginRoutes = require('./routes/login');

// plug in the body parser middleware and static middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
//app.use(cookieParser)


//static folder
//app.use(express.static(path.join(__dirname, 'public')));

const Sequelize = require('sequelize');
const config = require(__dirname + '/config/config.json')["development"];
var sequelize = new Sequelize(
    config.database,
    config.email,
    config.password,
    config
);

// initialize sequelize with session store
var SequelizeSession = require('connect-session-sequelize')(session.Store);
var mySession = new SequelizeSession({
    db: sequelize
});
// enable sessions
app.use(session({
    secret:"somesecretkey",
    resave: false, // Force save of session for each request
    saveUninitialized: false, // Save a session that is new, but has not been modified
    cookie: {maxAge: 10*60*1000 } // milliseconds!
}));

//Ignore driver cache
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
});

mySession.sync(); // this creates the session tables in your database

// plug in the routes
app.use('/admin', adminRoutes);
app.use(loginRoutes);

app.use(function (req, res, next) {
    res.status(404);
    res.render('404.ejs', {url: req.url,
        pageTitle: 'Error 404, page not found.'});
});

// plug in the error controller
//app.use(errorController.get404);
let port = process.env.PORT || 3000;
app.listen(port);
