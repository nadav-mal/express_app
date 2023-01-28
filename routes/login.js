const express = require('express');
const accountsController = require('../controllers/accounts');
const router = express.Router();

/* Login page. */
router.get('/', accountsController.getLogin);
router.post('/', accountsController.postLogin);
/* Registration page. */
router.get('/register', accountsController.getRegister);
router.post('/register', accountsController.postRegister);
/* Password registration page. */
router.get('/register-password', accountsController.getRegisterPassword);
router.post('/register-password', accountsController.postRegisterPassword);
/* Main website (ex5). */
router.get('/get-main', accountsController.getMain);
router.post('/get-main', accountsController.postMain);

module.exports = router;
