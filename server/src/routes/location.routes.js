const router = require('express').Router();
const locationController = require('../controllers/location.controller');

router.get('/search', locationController.search);

module.exports = router;
