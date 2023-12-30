import * as userController from "../controllers/userController.js";
import { Router } from "express";
import { protect } from "../middlewares/protectWare.js";

const router = Router();

// register user route

router.post("/register", userController.createUser);

// login user route

router.post("/login", userController.loginUser);

// update user route

router.put("/:id", protect, userController.updateUser);

// update user password route

router.put("/update-password/:id", protect, userController.updateUserPassword);

// get a user route

router.get("/u/:userId", userController.getUser);

// sending user friend request route

router.post(
  "/:id/friend-request",
  protect,
  userController.sendingFriendRequest
);

// accepting user friend request route

router.post(
  "/:id/friend-request/accept",
  protect,
  userController.acceptFriendRequest
);

// user friend requests  route

router.get(
  "/friend-requests",
  protect,
  userController.getAllUserFriendRequests
);

// user delete  route

router.delete("/:id", protect, userController.deleteUser);

export default router;
