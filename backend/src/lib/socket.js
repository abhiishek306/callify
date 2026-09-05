import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { sendStreamMessage } from "./stream.js";
import {
  recordCallSetupFailure,
  recordCallSetupSuccess,
  recordReconnectAttempt,
  recordReconnectSuccess,
} from "./metrics.js";

let io;

const ensureRoomMembership = (socket, roomId) => {
  if (!socket.data.joinedRooms) {
    socket.data.joinedRooms = new Set();
  }

  if (socket.data.joinedRooms.has(roomId)) {
    return false;
  }

  socket.join(roomId);
  socket.data.joinedRooms.add(roomId);
  return true;
};

export const initSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://callify-ki5o.onrender.com",
      ],
      credentials: true,
    },
  });

  if (process.env.REDIS_URL) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log("Socket.io Redis adapter enabled");
    } catch (error) {
      console.error("Redis adapter failed to initialize:", error);
    }
  }

  io.on("connection", (socket) => {
    socket.on("join-room", ({ roomId, userId }) => {
      if (!roomId || !userId) {
        recordCallSetupFailure();
        return;
      }

      const startedAt = Date.now();
      const isNewJoin = ensureRoomMembership(socket, roomId);
      socket.data.userId = userId;

      if (isNewJoin) {
        socket.to(roomId).emit("user-joined", { userId, roomId });
        recordCallSetupSuccess(Date.now() - startedAt);
      } else {
        socket.emit("room-state", { roomId, joined: true, duplicate: true });
      }
    });

    socket.on("leave-room", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
      if (socket.data.joinedRooms) {
        socket.data.joinedRooms.delete(roomId);
      }
    });

    socket.on("reconnect-attempt", ({ roomId, userId }) => {
      recordReconnectAttempt();

      if (roomId && userId) {
        ensureRoomMembership(socket, roomId);
        socket.data.userId = userId;
        socket.emit("room-state", { roomId, joined: true, recovered: true });
        recordReconnectSuccess();
      }
    });

    socket.on("send-message", async ({ roomId, userId, message }) => {
      if (roomId && userId && message) {
        const persistedMessage = await sendStreamMessage({
          channelId: roomId,
          userId,
          text: message,
        });

        io.to(roomId).emit("receive-message", {
          roomId,
          userId,
          message,
          persisted: Boolean(persistedMessage),
        });
      }
    });

    socket.on("typing", ({ roomId, userId, isTyping }) => {
      if (!roomId || !userId) return;
      socket.to(roomId).emit("typing-update", { roomId, userId, isTyping });
    });

    socket.on("disconnect", () => {
      const { userId } = socket.data;
      if (userId) {
        socket.broadcast.emit("user-left", { userId });
      }
    });
  });

  return io;
};

export const getIO = () => io;
