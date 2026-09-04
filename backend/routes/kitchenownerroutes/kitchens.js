const express = require('express');
const router = express.Router();
const  getAllKitchens  = require('../../controllers/kitchenownercontroller/kitchens');

router.get('/getAllKitchens', getAllKitchens);

module.exports = router;
