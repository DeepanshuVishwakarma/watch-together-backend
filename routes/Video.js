const express = require("express");
const router = express.Router();
const { VideoController } = require("../controllers/index");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const upload = require("../middlewares/multer");

router.post(
  "/upload",
  fileUpload({
    // debug: true,
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "./tempp"),
  }),
  VideoController.uploadVideo
);

router.get("/getVideobyId/:id", VideoController.getVideoById);
router.get("/search/tag/:tag", VideoController.searchVideoByTag);
router.get("/search/:name", VideoController.searchVideoByName);
router.get("/getAllVideos", VideoController.getAllVideos);
router.get("/delete/:id", VideoController.deleteVideoById);
router.get("/deleteAll", VideoController.deleteAll);
router.get("/update/:id", VideoController.updateById);

module.exports = router;
