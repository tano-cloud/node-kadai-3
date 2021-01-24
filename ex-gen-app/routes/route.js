const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController');

router.get('/', userController.displayHome);

router.get('/redirect', userController.redirect);

router.get('/start', userController.loadQuiz);

router.post('/start', userController.startQuiz);

module.exports = router;
