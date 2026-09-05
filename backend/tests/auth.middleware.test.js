import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { protectRoute } from "../src/middleware/auth.middleware.js";
import User from "../src/models/User.js";

test("protectRoute rejects requests without a token", async () => {
  const req = { cookies: {} };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await protectRoute(req, res, next);

  assert.equal(res.code, 401);
  assert.equal(nextCalled, false);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("protectRoute accepts a valid JWT and attaches the user", async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret";

  const previousFindById = User.findById;
  User.findById = async () => ({ _id: "user-123", fullName: "Test User" });

  const token = jwt.sign({ userId: "user-123" }, "test-secret", { expiresIn: "1h" });
  const req = { cookies: { jwt: token } };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await protectRoute(req, res, next);

  assert.equal(res.code, undefined);
  assert.equal(nextCalled, true);
  assert.equal(req.user.fullName, "Test User");

  process.env.JWT_SECRET = originalSecret;
  User.findById = previousFindById;
});
