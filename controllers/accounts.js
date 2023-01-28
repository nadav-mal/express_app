/**
 * The 'accounts.js' file is a middleware that handles the registration and login schemes for the application's user
 * accounts. It contains several functions that are responsible for different tasks related to user accounts,
 * such as creating new accounts, logging in and logging out, and validating user input.
 * These functions work together to ensure that user accounts are created and managed securely and efficiently.
 * They also help to maintain the integrity of the application by ensuring that all user input is valid and in
 * the correct format.
 */

const Cookies = require('cookies');
const {QueryTypes, Sequelize} = require('sequelize');
const Validator = require('validator');
const bcrypt = require('bcrypt');
const db = require('../models');
const keys = ['keyboard cat']

/**
 getRegister is a middleware function that handles the GET request for the registration page.
 It checks if the user is already logged in, if so redirects them to the main page.
 Otherwise, it creates a new instance of the Cookies class to handle cookies,
 retrieves the 'user' and 'dynamicMessage' cookies,
 sets message and data variables based on the cookies values.
 Then it renders the registration page, passing in the page title,
 dynamic message, path, email, firstname, and lastname as variables to be used in the template.
 */
exports.getRegister = (req, res) => {
    if (req.session.isLoggedIn)
        res.redirect("/get-main");
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
            path: '/register',
            email: data ? data.email : '',
            firstname: data ? data.firstname : '',
            lastname: data ? data.lastname : ''
        });
    }
};

/**
 postRegister is a middleware function that handles the POST request for the registration page.
 It validates the provided email, firstname and lastname,
 checks if the email is already registered in the db,
 sets a cookie, redirects to the register-password page or throws an error and redirects to the registration page.
 */
exports.postRegister = async (req, res) => {
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
        res.redirect('/register-password');
    } catch (err) {
        // TO DO! we must handle the error here and generate a EJS page to display the error.
        setCookieMessage(cookies, err.message, 3);
        res.redirect('/register');
    }
};

/**
 * @param user - the user's first registration page data (email, firstname, lastname).
 * This function validates the user's input after the user requested to continue to the register-password page.
 * If all inputs are valid, it would return nothing, else it will throw an error
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
 getLogin is a middleware function that handles the GET request for the login page.
 If the user already has an open session, it redirects them to the admin/get-main page.
 Otherwise, it renders the login page, passing the email and any error messages that were set in a cookie.
 It also clears the dynamicMessage cookie after it's been read.
 */
exports.getLogin = (req, res) => {
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

/**
 postLogin is a middleware function that handles the POST request for the login page.
 If the user already has an open session, it destroys the session and redirects to the homepage.
 */
exports.postLogin = (req, res) => {
    if (req.session.isLoggedIn)
        req.session.destroy();

    res.redirect('/');
}
/**
 *  a middleware function that is executed when a GET request is made to the
 *  '/after-login' route. It checks if the user has an active session by checking the
 *  'isLoggedIn' property on the session object. If the session is active,the user is welcomed by name.
 *  If the session is not active, the user is redirected to the login page and a message is set in the cookie to inform
 *  the user that their session has expired.
 **/
exports.getMain = (req, res) => {
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
/**
 postMain is a middleware function that handles login attempts.
 It checks if the provided email and password match a registered user,
 sets session variables and redirects to the main page on success.
 On failure, it sets an error message in a cookie and redirects to the login page.
 */
exports.postMain = async (req, res) => {
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
/**
 * This function handles a route in an Express.js application, checking if the user is logged in. If they are,
 * they are redirected to "/get-main", otherwise they are shown the "register-password" template.
 */
exports.getRegisterPassword = (req, res) => {
    if (req.session.isLoggedIn)
        res.redirect("/get-main");
    else
        res.render('register-password', {
            pageTitle: 'register password',
            dynamicMessage: '',
            path: '/register-password',
        });
};
/**
 * This function handles a route in an Express.js application, it checks if the user already exist in the system,
 * if the passwords match, validate the data and creates a new user with the email, firstname, lastname and hashed
 * password if the email is not taken, otherwise it throw an error message.
 * It also set a cookie message to confirm the registration if the registration is successful.
 */
exports.postRegisterPassword = async (req, res) => {
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
                        res.redirect('/register')
                    })
                }
            } else throw new Error('Passwords are not the same!');
        } else throw new Error('Cookies timed out.');
    } catch (err) {
        res.render('registration', {
            pageTitle: 'Registration',
            dynamicMessage: err.message,
            path: '/register',
            email: '',
            firstname: '',
            lastname: ''
        });
    }
};
/**
 * @param cookies - Cookies from the user
 * @param dynamicMessage - The message we want to add to the cookies
 * @param seconds - Message's max age
 * This function receives Cookies, dynamic message, seconds and sets the dynamic message on the cookies for the given
 * number of seconds.
 */
const setCookieMessage = (cookies, dynamicMessage, seconds) => {
    const Message = {dynamicMessage: dynamicMessage}
    cookies.set('dynamicMessage', JSON.stringify(Message), {singed: true, maxAge: seconds * 1000});
}