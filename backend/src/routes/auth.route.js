import express from "express";
import { login, logout, onboard, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { sendPhoneOtp, verifyPhoneOtp } from "../lib/otp.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/send-otp", authLimiter, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const result = await sendPhoneOtp(phoneNumber);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to send verification code" });
  }
});
router.post("/verify-otp", authLimiter, async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    await verifyPhoneOtp(phoneNumber, code);
    res.status(200).json({ success: true, message: "Phone verified successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Invalid verification code" });
  }
});

router.post("/onboarding", protectRoute, upload.single("profilePic"), onboard);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;