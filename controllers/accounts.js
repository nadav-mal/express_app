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
    if(req.session.isLoggedIn)
        res.redirect("/admin/get-main");
    else
    {
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
    }
};

exports.postRegister = async (req, res, next) => {
    const cookies = new Cookies(req, res, {keys: keys});
    try {
        let email = req.body.email
        const firstname = req.body.firstname
        const lastname = req.body.lastname
        const userData = {email: email, firstname: firstname, lastname: lastname};
        const isRegisteredUser = await db.User.findOne({ where: { email: req.body.email } });
        if(isRegisteredUser)
        {
            userData.email = ''
            cookies.set('user', JSON.stringify(userData), {singed: true, maxAge: 30 * 1000});
            throw new Error('this email is already taken.');
        }
        cookies.set('user', JSON.stringify(userData), {singed: true, maxAge: 30 * 1000});
        res.redirect('/admin/register-password');
    } catch (err) {
        // TO DO! we must handle the error here and generate a EJS page to display the error.
        setCookieMessage(cookies,err.message, 3);
        res.redirect('/admin/register');
    }
};

exports.getLogin = (req, res, next) => {
    // let accounts = Account.fetchAll(); db not implemented yet
    if(req.session.isLoggedIn)
        res.redirect('admin/get-main');
    else {
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
    }
};

exports.postLogin = (req, res, next) => {
    if(req.session.isLoggedIn)
        req.session.destroy();

    res.redirect('/');
}

exports.getMain = (req, res, next) => {
    if(req.session.isLoggedIn){
        let message = null
        message  = `Welcome, ${req.session.name}.`;
        res.render('after-login', {
            pageTitle: 'Logged in',
            dynamicMessage: message ? message : '',
            path: '/admin/after-login',
        });
    } else {
        const cookies = new Cookies(req,res, {keys: keys});
        setCookieMessage(cookies, 'Your session has expired, please login.', 3);
        res.redirect('/');
    }
};

exports.postMain = async (req, res, next) => {
    const cookies = new Cookies(req,res, {keys: keys});
    try{
        const isRegisteredUser = await db.User.findOne({ where: { email: req.body.email } });
        if(isRegisteredUser){
            if(req.body.password === isRegisteredUser.password){
                req.session.isLoggedIn = true;
                req.session.name = isRegisteredUser.firstName + " " + isRegisteredUser.lastName;
                res.redirect('get-main')
            }
            else throw new Error('The given password is incorrect.');
        } else{
            throw new Error('This email is not registered.');
        }
    } catch(err){
        setCookieMessage(cookies, `${err.message}`,2);
        res.redirect('/');
    }
};

exports.getRegisterPassword = (req, res, next) => {
    if(req.session.isLoggedIn)
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
            if (validatePasswords(req.body.password, req.body.confirm_password)) {
                const data = JSON.parse(user.toString());
                const isRegisteredUser = await db.User.findOne({ where: { email: data.email } });
                if(isRegisteredUser) {
                    throw new Error('This email is already taken.');
                } else {
                    const email = data.email;
                    const firstName = data.firstname;
                    const lastName = data.lastname;
                    const password = req.body.password;
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

//Searching for an email in the database to check if it already exists


//const users = await db.User.findAll();
//console.log(users);