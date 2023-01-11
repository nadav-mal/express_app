const express = require('express');
const accountsController = require('../controllers/accounts');
const router = express.Router();

router.get('/register', accountsController.getRegister);
router.post('/register', accountsController.postRegister);

router.get('/register-password', accountsController.getRegisterPassword);
router.post('/register-password', accountsController.postRegisterPassword);


module.exports = router;
