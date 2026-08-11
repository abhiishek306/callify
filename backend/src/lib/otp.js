import twilio from "twilio";
import { env } from "../config/env.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const normalizePhoneNumber = (phoneNumber = "") => phoneNumber.trim();

const isTwilioConfigured = Boolean(
  env.twilioAccountSid &&
    env.twilioAuthToken &&
    env.twilioVerifyServiceSid
);

export async function sendPhoneOtp(phoneNumber) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhone) {
    throw new Error("Phone number is required");
  }

  if (!isTwilioConfigured) {
    const code = generateOtp();
    otpStore.set(normalizedPhone, {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
      twilio: false,
    });

    return {
      success: true,
      message: `Verification code sent to ${normalizedPhone}. Demo code: ${code}`,
      demoCode: code,
      fallback: true,
    };
  }

  const client = twilio(env.twilioAccountSid, env.twilioAuthToken);

  await client.verify.v2
    .services(env.twilioVerifyServiceSid)
    .verifications.create({
      to: normalizedPhone,
      channel: "sms",
    });

  otpStore.set(normalizedPhone, {
    code: null,
    expiresAt: Date.now() + OTP_TTL_MS,
    twilio: true,
  });

  return {
    success: true,
    message: `Verification code sent to ${normalizedPhone}`,
    fallback: false,
  };
}

export async function verifyPhoneOtp(phoneNumber, code) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const otpRecord = otpStore.get(normalizedPhone);

  if (!otpRecord) {
    throw new Error("No verification request found for this phone number");
  }

  if (Date.now() > otpRecord.expiresAt) {
    otpStore.delete(normalizedPhone);
    throw new Error("Verification code expired. Please request a new one.");
  }

  if (!otpRecord.twilio) {
    if (otpRecord.code !== code) {
      throw new Error("Invalid verification code");
    }

    otpStore.delete(normalizedPhone);
    return true;
  }

  const client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  const verificationCheck = await client.verify.v2
    .services(env.twilioVerifyServiceSid)
    .verificationChecks.create({
      to: normalizedPhone,
      code,
    });

  if (verificationCheck.status !== "approved") {
    throw new Error("Invalid verification code");
  }

  otpStore.delete(normalizedPhone);
  return true;
}
