const { QueryTypes } = require('sequelize');
// the controllers folder allows us to separate the logic from the routes.
// this is a good practice because it allows us to reuse the logic in multiple routes.
// note that this controller returns HTML only! it sometimes also redirects to other routes.
// if it was a REST API, it would return JSON.
// pay attention NOT TO MIX HTML and JSON in the same controller.
const db = require('../models');

exports.getMessages = (req, res) => {
    const validators = validationBundle.getAndDeleteValidation
    // Get the message ID and timestamp from the request parameters
    const id = req.params.id
    const timestamp = req.params.timestamp
    if (validators.validateID(id) && db.checkID(id) && validators.validatePositive(timestamp)) {
        //Find the message with the specified ID
        const messages = db.Message.findAll();
        if (messages.timestamp > timestamp)
            res.json(messages.content)
        else
            res.status(300).send({message: 'No changes were made, you are up to date!'})
    } else if (!db.checkID(id))
        res.status(325).send({message: 'There are no messages on this image id.'})
    else
        res.status(400).send({message: 'An unexpected error.'})
}

exports.postMessage = async(req, res) => {
    console.log("here");
    const validators = validationBundle.postValidation
    // Get the message text, id and username from the request body
    const message = req.body.message
    console.log(message)
    const imgDate = req.body.id

    if(!req.session.email)
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
        db.Messages.create({
            imgDate:imgDate,
            content:message,
            email:email
        });
        //const msgs = await db.Message.findAll();
        //console.log(msgs);
        res.status(200).send({message: 'Message added successfully.'})
    }
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
