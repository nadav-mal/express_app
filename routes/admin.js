const express = require('express');
const accountsController = require('../controllers/accounts');
const nasaApi = require('../controllers/nasaApi');

const router = express.Router();
router.get('/register', accountsController.getRegister);
router.post('/register', accountsController.postRegister);

router.get('/register-password', accountsController.getRegisterPassword);
router.post('/register-password', accountsController.postRegisterPassword);

router.get('/', accountsController.getAccounts);
//router.post('/register-password', accountsController.postAccounts);

router.get('/get-main', accountsController.getMain); //change to: get start date
router.post('/get-main', accountsController.postMain);

router.get('/get-images', nasaApi.getImages);
router.post('/get-images', nasaApi.postImages);



module.exports = router;
