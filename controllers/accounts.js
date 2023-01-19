//const Account = require('../models/account');
//const User = require('../models/user');
const Cookies = require('cookies');
const { QueryTypes } = require('sequelize');
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
    const registerMessage = cookies.get('dynamicMessage')
    let message = null
    if(registerMessage){
        message = JSON.parse(registerMessage);
        cookies.set('dynamicMessage', '', { expires: new Date(0) });
    }
    let data = null
    if (user)
        data = JSON.parse(user.toString());
    res.render('registration', {
        pageTitle: 'Registration',
        dynamicMessage: message ? message.dynamicMessage : '',
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


/**
 * displays the home page that includes a list of all products.
 * @param req
 * @param res
 * @param next
 */
exports.getAccounts = (req, res, next) => {
    // let accounts = Account.fetchAll(); db not implemented yet
    const cookies = new Cookies(req,res, {keys: keys});
    const userData = cookies.get('dynamicMessage');
    let dynamicMessage = ''
    let message = null
    if(userData) {
        message = JSON.parse(userData);
        cookies.set('dynamicMessage', '', { expires: new Date(0) });
    }

    res.render('login', {
        pageTitle: 'Login',
        dynamicMessage: message ? message.dynamicMessage : '',
        path: '/',
    });
};


exports.getRegisterPassword = (req, res, next) => {

    res.render('register-password', {
        pageTitle: 'register password',
        dynamicMessage: '',
        path: '/admin/register-password',
    });
};

exports.getMain = (req, res, next) => {
    res.render('after-login', {
        pageTitle: 'Logged in',
        dynamicMessage: '',
        path: '/admin/after-login',
    });
};
exports.postMain = async (req, res, next) => {
    try{
        const users = await db.User.findAll();
        const isRegisteredUser = await db.User.findOne({ where: { email: req.body.email } });
        if(isRegisteredUser){
            if(req.body.password === isRegisteredUser.password){
                res.render('after-login', {
                    pageTitle: 'Logged in',
                    dynamicMessage: '',
                    path: '/admin/after-login',
                });
            }
            else throw new Error('The given password is incorrect.')
        } else{
            throw new Error('This email is not registered.')
        }
    } catch(err){
        const cookies = new Cookies(req,res, {keys: keys});
        setCookieMessage(cookies, `${err.message}`,2);
        res.redirect('/');
    }
};
/**
 * handles the post request from the add product page.
 * redirects to the home page to show all products.
 * @param req
 * @param res
 * @param next
 */
exports.postRegisterPassword = async (req, res, next) => {
    try {
        const cookies = new Cookies(req, res, {keys: keys});
        const user = cookies.get('user');
        if (user) {
            if (validatePasswords(req.body.password, req.body.confirm_password)) {
                const data = JSON.parse(user.toString());
                const isRegisteredUser = await db.User.findOne({ where: { email: data.email } });
                if(isRegisteredUser) {
                    throw new Error('This email is already taken.');
                } else {
                    const email = data.email
                    const firstName = data.firstname
                    const lastName = data.lastname;
                    const password = req.body.password
                    db.User.create({email : email, lastName: lastName, firstName : firstName, password : password})
                    setCookieMessage(cookies, 'You are now registered',2);
                    res.redirect('/');
                }
            } else throw new Error('Passwords are not the same!');
        } else throw new Error('Cookies timed out.');
    } catch (err) {
        res.render('registration', {
            pageTitle: 'Registration',
            dynamicMessage: err.message,
            path: '/admin/register',
            email : '',
            firstname : '',
            lastname : ''
        });
    }
};

const validatePasswords = (password, passwordRepeat) => {
    return password === passwordRepeat;
}

const setCookieMessage = (cookies,dynamicMessage, seconds) => {
    const Message = { dynamicMessage: dynamicMessage}
    cookies.set('dynamicMessage', JSON.stringify(Message), {singed: true, maxAge: seconds * 1000});
}


//const users = await db.User.findAll();
//console.log(users);