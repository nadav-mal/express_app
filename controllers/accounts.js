const Account = require('../models/account');

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
exports.getRegister = (req, res, next) => {
    res.render('register', {
        pageTitle: 'Registration',
        path: '/admin/register',
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
        const account = new Account(req.body.email, req.body.name, req.body.password);
        account.save();
        res.redirect('/');
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
    res.render('registration', {
        accounts: accounts,
        pageTitle: 'Login',
        path: '/',
        hasProducts: accounts.length > 0
    });

};