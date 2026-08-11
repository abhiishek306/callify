import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

export async function signup(req, res) {
  const { email, password, fullName, phoneNumber } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = phoneNumber?.trim();

  try {
    if (!fullName || !password || (!normalizedEmail && !normalizedPhone)) {
      return res.status(400).json({ message: "Full name, password, and either email or phone number are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
    }

    if (normalizedPhone) {
      const normalizedPhoneValue = normalizedPhone.replace(/\s+/g, "");
      if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhoneValue)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phoneNumber: normalizedPhone }].filter(Boolean),
    });

    if (existingUser) {
      const duplicateField = existingUser.email === normalizedEmail ? "Email" : "Phone number";
      return res.status(400).json({ message: `${duplicateField} already exists, please use a different one` });
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email: normalizedEmail || "",
      phoneNumber: normalizedPhone || "",
      fullName,
      password,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

    const token = jwt.sign({ userId: newUser._id }, jwtSecret, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevent XSS attacks,
      sameSite: "strict", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    if (error?.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: "Email already exists, please use a different one" });
      }
      if (error.keyPattern?.phoneNumber) {
        return res.status(400).json({ message: "Phone number already exists, please use a different one" });
      }
    }
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, phoneNumber, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phoneNumber?.trim().replace(/\s+/g, "");

    if ((!normalizedEmail && !normalizedPhone) || !password) {
      return res.status(400).json({ message: "Email or phone number and password are required" });
    }

    const user = await User.findOne({
      $or: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : []),
      ],
    });

    if (!user) return res.status(401).json({ message: "Invalid email/phone or password" });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email/phone or password" });

    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevent XSS attacks,
      sameSite: "strict", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location, profilePic } = req.body;
    const uploadedProfilePic = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : profilePic || req.user.profilePic || "";

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        profilePic: uploadedProfilePic,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}