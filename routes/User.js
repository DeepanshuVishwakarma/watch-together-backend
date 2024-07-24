const express = require('express'); 
const router = express.Router(); 

const {
    login , 
    signup 
} =require("../controllers/Auth");

const { auth } = require("../middlewares/auth")

router.post("/login", login);
router.post('/signup', signup);




module.exports = router;