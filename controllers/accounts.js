const Account = require('../models/account');

const Cookies = require('cookies');
// the controllers folder allows us to separate the logic from the routes.
// this is a good practice because it allows us to reuse the logic in multiple routes.
// note that this controller returns HTML only! it sometimes also redirects to other routes.
// if it was a REST API, it would return JSON.
// pay attention NOT TO MIX HTML and JSON in the same controller.

/**
 * displays the add product page that includes a form.
 * @param req
 * @param res
 * @param next
 */
const keys=['keyboard cat']
exports.getRegister = (req, res, next) => {
    console.log(req.cookie)
    const account = new Account(req,res);
    account.save();

    res.render('registration', {
        pageTitle: 'Registration',
        path: '/admin/register'
    });
};

/**
 * handles the post request from the add product page.
 * redirects to the home page to show all products.
 * @param req
 * @param res
 * @param next
 */
exports.postRegister = (req, res, next) => {
    try {
        const account = new Account(req,res);
        account.save();
        res.redirect('/admin/register-password');
    } catch (err) {
        // TO DO! we must handle the error here and generate a EJS page to display the error.
    }
};

/**
 * displays the home page that includes a list of all products.
 * @param req
 * @param res
 * @param next
 */
exports.getAccounts = (req, res, next) => {
    let accounts = Account.fetchAll();
    res.render('login', {
        accounts: accounts,
        pageTitle: 'Login',
        path: '/',
        hasProducts: accounts.length > 0
    });

};

exports.getRegisterPassword = (req, res, next) => {
   // const cookies = new Cookies(req,res, {keys: keys});
    const account = new Account(req,res);
    account.save();

    res.render('register-password', {
        pageTitle: 'Registration',
        path: '/admin/register-password',
    });
};

/**
 * handles the post request from the add product page.
 * redirects to the home page to show all products.
 * @param req
 * @param res
 * @param next
 */
exports.postRegisterPassword = (req, res, next) => {
    try {
        const account = new Account(req,res);
        account.save();
        res.redirect('/');
    } catch (err) {
        // TO DO! we must handle the error here and generate a EJS page to display the error.
    }
};
