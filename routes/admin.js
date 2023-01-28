const express = require('express');
const messagesController = require('../controllers/messages');

const router = express.Router();



/* GET messages. */
router.get('/messages/:id/:timestamp', messagesController.getMessages);
/* POST message. */
router.post('/messages', messagesController.postMessage);

/* DELETE message. */
router.delete('/deleteMessage', messagesController.deleteMessage);

module.exports = router;

