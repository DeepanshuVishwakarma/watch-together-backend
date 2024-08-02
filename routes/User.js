const express = require("express");
const router = express.Router();
const { UserController } = require("../controllers/index");

router.get("/search/:name", UserController.searchUserByName); // it should contain "firstName LastName"
router.get("/get/:id", UserController.getUserById);
router.delete("/delete", UserController.deleteUser);
router.post("/update", UserController.update);

module.exports = router;
