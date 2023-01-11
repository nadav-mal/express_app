const express = require('express');
const accountsController = require('../controllers/accounts');
const router = express.Router();


router.get('/', accountsController.getAccounts);
module.exports = router;
