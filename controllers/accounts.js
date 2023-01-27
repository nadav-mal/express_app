const Cookies = require('cookies');
const {QueryTypes, Sequelize} = require('sequelize');
let Validator = require('validator');
const bcrypt = require('bcrypt');

// the controllers folder allows us to separate the logic from the routes.
// this is a good practice because it allows us to reuse the logic in multiple routes.
// note that this controller returns HTML only! it sometimes also redirects to other routes.
// if it was a REST API, it would return JSON.
// pay attention NOT TO MIX HTML and JSON in the same controller.
const db = require('../models');
const keys = ['keyboard cat']


/**
 * @param req
 * @param res
 * @param next
 */
exports.getRegister = (req, res, next) => {
    if (req.session.isLoggedIn)
        res.redirect("/admin/get-main");
    else {
        const cookies = new Cookies(req, res, {keys: keys});
        const user = cookies.get('user');
        const registerMessage = cookies.get('dynamicMessage')
        let message = null
        if (registerMessage) {
            message = JSON.parse(registerMessage);
            cookies.set('dynamicMessage', '', {expires: new Date(0)});
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
    }
};

/**
 * @param req - request from 'registration'
 * @param res - next page which will displayed after this request was made by a user
 * @param next - ?
 * This function is triggered from admin after receiving a request for the url
 */
exports.postRegister = async (req, res, next) => {
    const cookies = new Cookies(req, res, {keys: keys});
    try {
        //Validating input before checking in db
        const userData = {email: req.body.email, firstname: req.body.firstname , lastname: req.body.lastname};
        validateUser(userData); //Validating request input fields before accessing the database
        const isRegisteredUser = await db.User.findOne({where: {email: userData.email.toLowerCase()}});
        if (isRegisteredUser) {
            userData.email = ''
            cookies.set('user', JSON.stringify(userData), {singed: true, maxAge: 3 * 1000});
            throw new Error('This email is already taken.');
        }
        cookies.set('user', JSON.stringify(userData), {singed: true, maxAge: 30 * 1000});
        res.redirect('/admin/register-password');
    } catch (err) {
        // TO DO! we must handle the error here and generate a EJS page to display the error.
        setCookieMessage(cookies, err.message, 3);
        res.redirect('/admin/register');
    }
};

/**
 * @param user - the user's first registration page data (email, firstname, lastname).
 * This function validates the user's input after the user requested to continue to the register-password page.
 */
function validateUser(user) {
    // Email validation
    if (!Validator.isEmail(user.email))
        throw new Error(`${user.email} is not a valid email address.`);
    const errString = 'name should only contain letters and should be between 3 and 32 characters'
    // First name validation
    if (!Validator.isAlpha(user.firstname) || !Validator.isLength(user.firstname.trim(), { min: 3, max: 32 }))
        throw new Error(`First ${errString}`);
    // Last name validation
    if (! Validator.isAlpha(user.lastname) || !Validator.isLength(user.lastname.trim(), { min: 3, max: 32 }))
        throw new Error(`Last ${errString}`);
}

/**
 * @param req -
 * @param res
 * @param next
 */
exports.getLogin = (req, res, next) => {
    //If user has an open session
    if (req.session.isLoggedIn)
        res.redirect('admin/get-main');
    else {
        const cookies = new Cookies(req, res, {keys: keys});
        const userData = cookies.get('dynamicMessage');
        const email = req.session.email;
        let dynamicMessage = ''
        let message = null
        if (userData) {
            message = JSON.parse(userData);
            cookies.set('dynamicMessage', '', {expires: new Date(0)});
        }

        res.render('login', {
            pageTitle: 'Login',
            dynamicMessage: message ? message.dynamicMessage : '',
            path: '/',
        });
    }
};

exports.postLogin = (req, res, next) => {
    if (req.session.isLoggedIn)
        req.session.destroy();

    res.redirect('/');
}

exports.getMain = (req, res, next) => {
    if (req.session.isLoggedIn) {
        let message = null
        message = `Welcome, ${req.session.name}.`;
        res.render('after-login', {
            pageTitle: 'Logged in',
            userMail: req.session.email,
            dynamicMessage: message ? message : '',
            path: '/admin/after-login',
        });
    } else {
        const cookies = new Cookies(req, res, {keys: keys});
        setCookieMessage(cookies, 'Your session has expired, please login.', 3);
        res.redirect('/');
    }
};

exports.postMain = async (req, res, next) => {
    const cookies = new Cookies(req, res, {keys: keys});
    try { //converting email to lowercase since we want email field to be case-insensitive.
        const isRegisteredUser = await db.User.findOne({where: {email: req.body.email.toLowerCase()}});
        if (isRegisteredUser) {
            const isMatch = await bcrypt.compare(req.body.password, isRegisteredUser.password);
            if (isMatch) {
                req.session.isLoggedIn = true;
                req.session.name = isRegisteredUser.firstName + " " + isRegisteredUser.lastName;
                req.session.email = isRegisteredUser.email;
                res.redirect('get-main')
            } else throw new Error('The given password is incorrect.');
        } else {
            throw new Error('This email is not registered.');
        }
    } catch (err) {
        setCookieMessage(cookies, `${err.message}`, 2);
        res.redirect('/');
    }
};

exports.getRegisterPassword = (req, res, next) => {
    if (req.session.isLoggedIn)
        res.redirect("/admin/get-main");
    else
        res.render('register-password', {
            pageTitle: 'register password',
            dynamicMessage: '',
            path: '/admin/register-password',
        });
};

exports.postRegisterPassword = async (req, res, next) => {
    try {
        const cookies = new Cookies(req, res, {keys: keys});
        const user = cookies.get('user');
        if (user) {
            if(Validator.equals(req.body.password, req.body.confirm_password)) {
                const data = JSON.parse(user.toString());
                data.email = data.email.toLowerCase() //Making it case-insensitive
                validateUser(data); //Validating data from cookies
                const isRegisteredUser = await db.User.findOne({where: {email: data.email}});
                if (isRegisteredUser) {
                    throw new Error('This email is already taken.');
                } else {
                    const hashedPassword = await bcrypt.hash(req.body.password, 10);
                    db.User.create({
                        email: data.email,
                        firstName: data.firstname,
                        lastName: data.lastname,
                        password: hashedPassword
                    }).then(() => {
                        setCookieMessage(cookies, 'You are now registered', 2);
                        res.redirect('/');
                    }).catch(err => {
                        if (err instanceof Sequelize.ValidationError)
                            setCookieMessage(cookies, err.errors[0].message, 2);
                        else
                            setCookieMessage(cookies,'Validation has failed, please try again.', 2);
                        res.redirect('/admin/register')
                    })
                }
            } else throw new Error('Passwords are not the same!');
        } else throw new Error('Cookies timed out.');
    } catch (err) {
        res.render('registration', {
            pageTitle: 'Registration',
            dynamicMessage: err.message,
            path: '/admin/register',
            email: '',
            firstname: '',
            lastname: ''
        });
    }
};

const setCookieMessage = (cookies, dynamicMessage, seconds) => {
    const Message = {dynamicMessage: dynamicMessage}
    cookies.set('dynamicMessage', JSON.stringify(Message), {singed: true, maxAge: seconds * 1000});
}