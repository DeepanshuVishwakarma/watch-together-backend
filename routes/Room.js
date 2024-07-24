const express = require("express");
const router = express.Router();

const {
  isRoomExist,
  isRoomAdmin,
  isCreatedByUser,
} = require("../middlewares/room-middlewares");

const { RoomController } = require("../controllers/index");

// User routes
router.post("/create", RoomController.createRoom);
router.get("/getAll", RoomController.getAllRooms);
router.post("/leave/:id", isRoomExist, RoomController.leaveRoom);

// Owner routes
router.post(
  "/update/:id",
  isRoomExist,
  isCreatedByUser,
  RoomController.updateRoom
);
router.get(
  "/delete/:id", // Corrected this line
  isRoomExist,
  isCreatedByUser,
  RoomController.deleteRoom
);
router.post(
  "/removeMember/:id/:userId", // Corrected this line
  isRoomExist,
  isCreatedByUser,
  RoomController.removeMember
);

module.exports = router;

// router.post("/join/:id", RoomController.joinRoom);
// router.post("/addMember/:id", RoomController.addMember);
// router.post("/askForRoomOwnership", RoomController.askForRoomOwnership);
// router.post("/restrictMembers/:id", RoomController.restrictMembers); //owner
// router.post("/changeRoomOwnership/:id", RoomController.changeRoomOwnership); //owner
