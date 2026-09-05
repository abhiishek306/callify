import express from "express";
import { login, logout, onboard, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { sendPhoneOtp, verifyPhoneOtp } from "../lib/otp.js";
import { createErrorResponse } from "../lib/http.js";
import {
  onboardingSchema,
  otpRequestSchema,
  otpVerifySchema,
  loginSchema,
  signupSchema,
} from "../lib/validators.js";

const router = express.Router();

router.post("/signup", authLimiter, validateRequest(signupSchema), signup);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.post("/logout", logout);
router.post("/send-otp", authLimiter, validateRequest(otpRequestSchema), async (req, res) => {
  try {
    const { phoneNumber } = req.validatedBody;
    const result = await sendPhoneOtp(phoneNumber);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json(createErrorResponse("OTP_SEND_FAILED", error.message || "Failed to send verification code"));
  }
});
router.post("/verify-otp", authLimiter, validateRequest(otpVerifySchema), async (req, res) => {
  try {
    const { phoneNumber, code } = req.validatedBody;
    await verifyPhoneOtp(phoneNumber, code);
    res.status(200).json({ success: true, message: "Phone verified successfully" });
  } catch (error) {
    res.status(400).json(createErrorResponse("OTP_VERIFY_FAILED", error.message || "Invalid verification code"));
  }
});

router.post("/onboarding", protectRoute, upload.single("profilePic"), validateRequest(onboardingSchema), onboard);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;