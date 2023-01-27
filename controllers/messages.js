const {QueryTypes} = require('sequelize');
// the controllers folder allows us to separate the logic from the routes.
// this is a good practice because it allows us to reuse the logic in multiple routes.
// note that this controller returns HTML only! it sometimes also redirects to other routes.
// if it was a REST API, it would return JSON.
// pay attention NOT TO MIX HTML and JSON in the same controller.
const db = require('../models');
const Cookies = require("cookies");
const Validator = require('validator');
const keys = ['keyboard cat']
const sessionErr =  "Your session has expired.";

exports.getMessages = async (req, res) => {
    if (!req.session || !req.session.isLoggedIn) {
        const cookies = new Cookies(req, res, {keys: keys});
        setCookieMessage(cookies, sessionErr, 3);
        res.status(369).send({message: sessionErr});
    }
    else {
        const validators = validationBundle.getAndDeleteValidation
        // Get the message ID and timestamp from the request parameters
        const id = req.params.id
        const timestamp = req.params.timestamp
        //1: check if this id is a valid date
        //2: get the latest message from this db
        //3: if the latest message is already displayed do nothing else return all
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
                }
                else
                    res.status(325).send({message: 'You are up to date!'});
            }
        }
        else
            res.status(300).send({message: 'No messages on this post'});
    }
}

exports.postMessage = async (req, res) => {
    if (!req.session || !req.session.isLoggedIn) {
        const cookies = new Cookies(req, res, {keys: keys});
        setCookieMessage(cookies, sessionErr, 3);
        res.status(369).send();
    }
    else {
        const validators = validationBundle.postValidation
        // Get the message text, id and username from the request body
        const message = req.body.message
        const imgDate = req.body.id
        const email = req.session.email
        if (!validators.validateMessage(message))
            res.status(401).send({message: 'Comment contains spaces only.'})
        else if (!validators.validateID(imgDate))
            res.status(400).send({message: 'Invalid date format (YYYY-MM-DD).'})
        else {
            // Return a success response
            db.Message.create({
                imgDate: imgDate,
                content: message,
                email: email,
                isDeleted: false
            });

            res.status(200).send({message: 'Message added successfully.'})
        }
    }
}

exports.deleteMessage = async (req, res) => {
    if (!req.session || !req.session.isLoggedIn) {
        const cookies = new Cookies(req, res, {keys: keys});
        setCookieMessage(cookies, sessionErr, 3);
        res.status(369).send();
    }
    else {
        const validators = validationBundle.getAndDeleteValidation;
        let id = req.body.id;
        let email = req.body.email;
        let createdAt = req.body.createdAt;
        if (validators.validateID(id))
        {
            let msg = await db.Message.findOne({
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
        }
        else res.status(402).send({message: `Oops... seems like request is invalid!`})
    }
};

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
    const validateMessage = (message) => {
        return (message !== undefined && message !== null && (0 < message.trim().length <= 128) && (message.trim()))
    }
    const validateID = (id) => {
        // NASA date format: YYYY-MM-DD
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        return regex.test(id);
    }

    validation.postValidation = {validateID, validateMessage};
    validation.getAndDeleteValidation = {validateID};

}(validationBundle));

const setCookieMessage = (cookies, dynamicMessage, seconds) => {
    const Message = {dynamicMessage: dynamicMessage}
    cookies.set('dynamicMessage', JSON.stringify(Message), {singed: true, maxAge: seconds * 1000});
}