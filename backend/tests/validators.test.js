import test from "node:test";
import assert from "node:assert/strict";

import { signupSchema, loginSchema, otpRequestSchema } from "../src/lib/validators.js";

test("signupSchema rejects empty credentials", () => {
  const result = signupSchema.safeParse({
    fullName: "Test User",
    password: "secret",
    email: "",
    phoneNumber: "",
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, "Either email or phone number is required");
});

test("loginSchema accepts a valid phone login", () => {
  const result = loginSchema.safeParse({
    phoneNumber: "+12345678901",
    password: "secret123",
  });

  assert.equal(result.success, true);
});

test("otpRequestSchema rejects malformed phone numbers", () => {
  const result = otpRequestSchema.safeParse({ phoneNumber: "invalid" });

  assert.equal(result.success, false);
});
