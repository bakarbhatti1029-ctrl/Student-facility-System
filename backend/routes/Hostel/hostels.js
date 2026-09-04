const express = require('express');
const router = express.Router();
const getAllHostels  = require('../../controllers/hostelownercontroller/hostels.js');
const getFilteredHostels = require('../../controllers/hostelownercontroller/searchAndFilterHostel.js');  

router.get('/getAllHostels', getAllHostels);
router.get('/getFilteredHostels', getFilteredHostels);

module.exports = router;
