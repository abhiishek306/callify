import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { io as Client } from "socket.io-client";

import { initSocket } from "../src/lib/socket.js";

test("socket room join is idempotent and reconnect rehydrates room state", async (t) => {
  const server = http.createServer();

  await initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));

  const port = server.address().port;
  const clientA = Client(`http://localhost:${port}`, { transports: ["websocket"] });
  const clientB = Client(`http://localhost:${port}`, { transports: ["websocket"] });

  t.after(async () => {
    clientA.disconnect();
    clientB.disconnect();
    await new Promise((resolve) => server.close(resolve));
  });

  const joinSeen = new Promise((resolve) => {
    clientB.on("user-joined", (payload) => {
      if (payload.userId === "user-a" && payload.roomId === "room-42") {
        resolve(payload);
      }
    });
  });

  await new Promise((resolve, reject) => {
    clientA.on("connect", () => {
      clientA.emit("join-room", { roomId: "room-42", userId: "user-a" });
      resolve();
    });
    clientA.on("connect_error", reject);
  });

  await new Promise((resolve, reject) => {
    clientB.on("connect", () => {
      clientB.emit("join-room", { roomId: "room-42", userId: "user-b" });
      resolve();
    });
    clientB.on("connect_error", reject);
  });

  const payload = await joinSeen;
  assert.equal(payload.userId, "user-a");

  const duplicateState = new Promise((resolve) => {
    clientA.once("room-state", (state) => resolve(state));
    clientA.emit("join-room", { roomId: "room-42", userId: "user-a" });
  });

  const duplicate = await duplicateState;
  assert.equal(duplicate.duplicate, true);

  const recoveredState = new Promise((resolve) => {
    clientA.once("room-state", (state) => resolve(state));
    clientA.emit("reconnect-attempt", { roomId: "room-42", userId: "user-a" });
  });

  const recovered = await recoveredState;
  assert.equal(recovered.recovered, true);
});