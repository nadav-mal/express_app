const express = require('express');
const accountsController = require('../controllers/accounts');
const router = express.Router();

router.get('/register', accountsController.getRegister);
router.post('/register', accountsController.postRegister);

module.exports = router;
