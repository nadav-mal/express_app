const express = require('express');
const accountsController = require('../controllers/accounts');
const messagesController = require('../controllers/messages');

const router = express.Router();
router.get('/register', accountsController.getRegister);
router.post('/register', accountsController.postRegister);

router.get('/register-password', accountsController.getRegisterPassword);
router.post('/register-password', accountsController.postRegisterPassword);

router.get('/', accountsController.getLogin);
router.post('/', accountsController.postLogin);

router.get('/get-main', accountsController.getMain); //change to: get start date
router.post('/get-main', accountsController.postMain);

/* GET messages. */
router.get('/messages/:id/:timestamp', messagesController.getMessages);
/* POST message. */
router.post('/messages', messagesController.postMessage);

/* DELETE message. */
router.delete('/deleteMessage', messagesController.deleteMessage);

module.exports = router;

