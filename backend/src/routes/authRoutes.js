import { Router } from "express";
import {
  currentUser,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import {
  changePassword,
  updateProfile,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, currentUser);
router.patch("/profile", protect, uploadAvatar, updateProfile);
router.patch("/password", protect, changePassword);
export default router;