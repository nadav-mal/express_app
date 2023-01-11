/* testing */
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

// load the routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/login');

// plug in the body parser middleware and static middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// plug in the routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);

// plug in the error controller
//app.use(errorController.get404);
let port = process.env.PORT || 3000;
app.listen(port);
