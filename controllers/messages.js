const {QueryTypes, Sequelize} = require('sequelize');
// the controllers folder allows us to separate the logic from the routes.
const db = require('../models');
const Cookies = require("cookies");
const keys = ['keyboard cat']
const sessionErr = "Your session has expired.";

/***
 * This function exports a getMessages method that handles GET requests by checking if a user is logged in,
 * extracting message ID and timestamp from request parameters, and retrieves the latest message from the database.
 * It compares the timestamp passed in the request with the timestamp of the latest message and retrieves all the messages from the database and sends them in JSON format.
 */
exports.getMessages = async (req, res) => {
    if (!req.session || !req.session.isLoggedIn) {
        const cookies = new Cookies(req, res, {keys: keys});
        setCookieMessage(cookies, sessionErr, 3);
        res.status(369).send({message: sessionErr});
    } else {
        const validators = validationBundle.getAndDeleteValidation
        if(!validators.validateID(id))
            res.status(402).send({message: 'An invalid date format was given.'})
        // Get the message ID and timestamp from the request parameters
        const id = req.params.id
        const timestamp = req.params.timestamp
        const latestMessage = await db.Message.findAll({
            where: {imgDate: id},
            order: [['updatedAt', 'DESC']],
            limit: 1
        });
        if (latestMessage[0]) {
            const message = latestMessage[0]; //messages is the array of messages. since limit is 1 there's only one
            if (message.dataValues) {
                const updatedAt = message.dataValues.updatedAt; //After adding status, it will be message.dataValues.updatedAt
                const updatedAtEpoch = new Date(updatedAt).getTime(); //converting to epoch

                if (timestamp < updatedAtEpoch) {
                    const messages = await db.Message.findAll({
                        where: {imgDate: id, isDeleted: false},
                        order: [['updatedAt', 'ASC']] //(oldest first)
                    })
                    if (messages)
                        res.status(200).json(messages);
                } else
                    res.status(325).send({message: 'You are up to date!'});
            }
        } else
            res.status(300).send({message: 'No messages on this post'});
    }
}

/***
 * This function exports a postMessage method that is intended to handle HTTP POST requests.
 * It first checks if a user is logged in by checking the session object, and if not it sets an error cookie and sends a 369 status code.
 * If the user is logged in, it validates the request body for a valid message and ID, and if valid,
 * it creates a new message in the database with the provided information and sends a 200 status code.
 * If any errors occur, it sends an appropriate status code along with an error message.
 */
exports.postMessage = async (req, res) => {
    const cookies = new Cookies(req, res, {keys: keys});
    if (!req.session || !req.session.isLoggedIn) {
        setCookieMessage(cookies, sessionErr, 3);
        res.status(369).send();
    } else {
        console.log('starting validation')
        const validators = validationBundle.postValidation
        // Get the message text, id and username from the request body
        const message = req.body.message
        const imgDate = req.body.id
        const email = req.session.email
        if (!(validators.validateID(imgDate) && validators.validateMessage(message)))
            res.status(402).send({message: 'An invalid request.'});
        else {
            db.Message.create({
                    imgDate: imgDate,
                    content: message,
                    email: email,
                    isDeleted: false
                }
            ).then(() => {
                res.status(200).send({message: 'Message added successfully'});
            })
                .catch(err => {
                    if (err instanceof Sequelize.ValidationError) {
                        res.status(402).send(err.errors[0].message);
                    } else {
                        res.status(200).send({message: 'Message added successfully.'})
                    }
                });
        }
    }
}

/**
 This function handles deletion of a message by an authenticated user. It checks session, validates message data,
 marks message as deleted, sets a timer for permanent deletion, and sends success/failure status & message.
 */
exports.deleteMessage = async (req, res) => {
    if (!req.session || !req.session.isLoggedIn) {
        const cookies = new Cookies(req, res, {keys: keys});
        setCookieMessage(cookies, sessionErr, 3);
        res.status(369).send();
    } else {
        const validators = validationBundle.getAndDeleteValidation;
        let id = req.body.id;
        let email = req.body.email;
        let createdAt = req.body.createdAt;
        if (validators.validateID(id)) {
            await db.Message.findOne({
                where: {
                    imgDate: id,
                    createdAt: createdAt,
                    email: email,
                    isDeleted: false
                }
            }).then(message => {
                if (message) {
                    message.update({
                        isDeleted: true
                    });
                    setDeleteTimer(id, createdAt, email);
                    return message
                }
            });
            res.status(200).send({message: `Message removed successfully`})
        } else res.status(402).send({message: `Oops... seems like request is invalid!`})
    }
};
/**
 setDeleteTimer is a function that schedules the deletion of a message from the database after a certain amount of time.
 It takes in three parameters:
 @param {string} id - The id of the message that needs to be deleted.
 @param {string} createdAt - The timestamp of when the message was created.
 @param {string} email - The email address of the user who sent the message.
 The function uses the setTimeout method to schedule the deletion of the message from the database
 after 20 seconds (20000 milliseconds) have passed.
 */
const setDeleteTimer = (id, createdAt, email) => {
    setTimeout(() => {
        db.Message.destroy({
            where: {
                imgDate: id,
                createdAt: createdAt,
                email: email
            }
        });
    }, 20000);
}

/** Validation Management. */
let validationBundle = {};
(function validationFunctions(validation) {
    const Validator = require('validator');

    /***
     * Validates a message.
     * @param message to be validated.
     * @returns {boolean} validation confirmed or not confirmed.
     */
    function validateMessage(message) {
        return (Validator.isLength(message.trim(), {min: 1, max: 128}))
    }

    /***
     * Validates an ID.
     * @param id to be validated.
     * @returns {boolean} validation confirmed or not confirmed.
     */
    const validateID = (id) => {
        // NASA date format: YYYY-MM-DD
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        return regex.test(id);
    }

    validation.postValidation = {validateID, validateMessage};
    validation.getAndDeleteValidation = {validateID};
}(validationBundle));

/***
 * Sets a message in the cookies.
 * @param cookies the cookies object.
 * @param dynamicMessage the message to be set in the cookies.
 * @param seconds - for how long to set it there.
 */
const setCookieMessage = (cookies, dynamicMessage, seconds) => {
    const Message = {dynamicMessage: dynamicMessage}
    cookies.set('dynamicMessage', JSON.stringify(Message), {singed: true, maxAge: seconds * 1000});
}