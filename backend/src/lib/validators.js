import { z } from "zod";

const emailSchema = z.string().trim().email("Please provide a valid email address");
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Please provide a valid phone number");

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().trim().email("Please provide a valid email address").optional().or(z.literal("")),
  phoneNumber: phoneSchema.optional().or(z.literal("")),
}).refine((data) => Boolean(data.email || data.phoneNumber), {
  message: "Either email or phone number is required",
  path: ["email"],
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address").optional().or(z.literal("")),
  phoneNumber: phoneSchema.optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => Boolean(data.email || data.phoneNumber), {
  message: "Either email or phone number is required",
  path: ["email"],
});

export const otpRequestSchema = z.object({
  phoneNumber: phoneSchema,
});

export const otpVerifySchema = z.object({
  phoneNumber: phoneSchema,
  code: z.string().trim().min(4, "Verification code is required"),
});

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  bio: z.string().trim().min(10, "Bio must be at least 10 characters"),
  nativeLanguage: z.string().trim().min(2, "Native language is required"),
  learningLanguage: z.string().trim().min(2, "Learning language is required"),
  location: z.string().trim().min(2, "Location is required"),
  profilePic: z.string().url().optional().or(z.literal("")),
});
