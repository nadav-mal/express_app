//const Account = require('../models/account');
//const User = require('../models/user');
const Cookies = require('cookies');
// the controllers folder allows us to separate the logic from the routes.
// this is a good practice because it allows us to reuse the logic in multiple routes.
// note that this controller returns HTML only! it sometimes also redirects to other routes.
// if it was a REST API, it would return JSON.
// pay attention NOT TO MIX HTML and JSON in the same controller.
const db = require('../models');
/**
 * displays the add product page that includes a form.
 * @param req
 * @param res
 * @param next
 */
const keys = ['keyboard cat']
exports.getRegister = (req, res, next) => {
    const cookies = new Cookies(req, res, {keys: keys});
    const user = cookies.get('user');
    let data = null
    if (user)
        data = JSON.parse(user.toString());
    res.render('registration', {
        pageTitle: 'Registration',
        pageError: '',
        path: '/admin/register',
        email: data ? data.email : '',
        firstname: data ? data.firstname : '',
        lastname: data ? data.lastname : ''
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

        const cookies = new Cookies(req, res, {keys: keys});
        const email = req.body.email
        const firstname = req.body.firstname
        const lastname = req.body.lastname
        const userData = {email: email, firstname: firstname, lastname: lastname};
        cookies.set('user', JSON.stringify(userData), {singed: true, maxAge: 30 * 1000});
        res.redirect('/admin/register-password');
    } catch (err) {
        // TO DO! we must handle the error here and generate a EJS page to display the error.
    }
};

exports.getAccountSubmission = (req, res, next) => {
    try {
        const cookies = new Cookies(req, res, {keys: keys});
        const user = cookies.get('user');
        let data = null
        if (user) {
            data = JSON.parse(user.toString());

        }

        res.redirect('/admin/register-password');
    } catch (err) {
        // TO DO! we must handle the error here and generate a EJS page to display the error.
    }
};//

/**
 * displays the home page that includes a list of all products.
 * @param req
 * @param res
 * @param next
 */
exports.getAccounts = (req, res, next) => {
    // let accounts = Account.fetchAll(); db not implemented yet
    res.render('login', {
        //accounts: accounts,
        pageTitle: 'Login',
        pageError: '',
        path: '/',
        //hasProducts: accounts.length > 0
    });

};


exports.getRegisterPassword = (req, res, next) => {
    // const cookies = new Cookies(req,res, {keys: keys});
    res.render('register-password', {
        pageTitle: 'register password',
        pageError: '',
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
exports.postRegisterPassword = async (req, res, next) => {
    try {//HERE WE SHOULD CHECK, IF COOKIE LIFETIME IS DEAD MAYBE REDIRECT TO START
        //const account = new Account(req,res);
        //account.save();
        const cookies = new Cookies(req, res, {keys: keys});
        const user = cookies.get('user');
        if (user) {
            let data = JSON.parse(user.toString());
            //console.log(req.body);
            const password = req.body.password;
            const passwordRepeat = req.body.confirm_password;
            if (validatePasswords(password, passwordRepeat)) {

                const email = data.email
                const firstName = "firstname"//data.firstname
                const lastName = "lastname" //data.lastname;
                const password = req.body.password

                console.log("in here creating")

                db.User.create({email, lastName, firstName, password})
                const users = await db.User.findAll();
                console.log(users);
                res.render('login', {
                    //accounts: accounts,
                    pageTitle: 'Login',
                    pageError: 'You are now registered',
                    path: '/',
                })
            } else {
                res.render('register-password', {
                    pageTitle: 'password insertion',
                    pageError: 'Passwords are not the same',
                    path: '/admin/register',
                    email: data ? data.email : '',
                    firstname: data ? data.firstname : '',
                    lastname: data ? data.lastname : ''
                });
            }
        } else {
            res.render('registration', {
                pageTitle: 'Registration',
                pageError: 'Cookies timed out, please try again',
                path: '/admin/register',
                email: '',
                firstname: '',
                lastname: ''
            });
            console.log('cookies timeout');

            res.redirect('/admin/register-password');
        }
        res.redirect('/');
    } catch (err) {
         console.log(err);
        // TO DO! we must handle the error here and generate a EJS page to display the error.
    }
};

const validatePasswords = (password, passwordRepeat) => {
    return password === passwordRepeat;
}