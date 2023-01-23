const {QueryTypes} = require('sequelize');
// the controllers folder allows us to separate the logic from the routes.
// this is a good practice because it allows us to reuse the logic in multiple routes.
// note that this controller returns HTML only! it sometimes also redirects to other routes.
// if it was a REST API, it would return JSON.
// pay attention NOT TO MIX HTML and JSON in the same controller.
const db = require('../models');


exports.getMessages = async (req, res) => {
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
        if (message && message.dataValues) {
            const updatedAt = message.dataValues.updatedAt; //After adding status, it will be message.dataValues.updatedAt
            const updatedAtEpoch = new Date(updatedAt).getTime(); //converting to epoch

            if (timestamp < updatedAtEpoch) {
                const messages = await db.Message.findAll({
                    where: {imgDate: id, isDeleted: false},
                    order: [['updatedAt', 'ASC']] //(oldest first)
                })
                if (messages){
                    res.status(200).json(messages);
                }
                 else{
                    res.status(300).send({message: 'No messages on this post'});
                }
            }
            else
                res.status(325).send({message: 'You are up to date!'});
        }
    }
}

exports.postMessage = async (req, res) => {
    console.log("here");
    const validators = validationBundle.postValidation
    // Get the message text, id and username from the request body
    const message = req.body.message
    const imgDate = req.body.id
    if (!req.session.email)
        res.status(404).send({message: 'Email session has expired.'})
    const email = req.session.email
    if (!validators.validateMessage(message))
        res.status(400).send({message: 'Comment contains spaces only.'})
    else if (!validators.validateID(imgDate))
        res.status(400).send({message: 'Invalid date format (YYYY-MM-DD).'})
        //else if (!validators.validateUsername(username))
    //    res.status(400).send({message: 'Invalid username.'})
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

exports.deleteMessage = async (req, res) => {
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
    else res.status(400).send({message: `Oops... seems like request is invalid!`})
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

    const validateUsername = (username) =>
        (username.length <= 24 && username.length > 0 && !(/\W/.test(username)))

    const validatePositive = (num) => (num >= 0)

    validation.postValidation = {validateID, validateMessage, validateUsername};
    validation.getAndDeleteValidation = {validateID, validatePositive};

}(validationBundle));

