const express = require('express');
const accountsController = require('../controllers/accounts');
const router = express.Router();


router.get('/', accountsController.getLogin);
router.post('/', accountsController.postLogin);

router.get('/register', accountsController.getRegister);
router.post('/register', accountsController.postRegister);

router.get('/register-password', accountsController.getRegisterPassword);
router.post('/register-password', accountsController.postRegisterPassword);

router.get('/get-main', accountsController.getMain); //change to: get start date
router.post('/get-main', accountsController.postMain);

module.exports = router;
