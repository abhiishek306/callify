import { Server } from "socket.io";
import { sendStreamMessage } from "./stream.js";

let io;

export const initSocket = (server) => {
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

  io.on("connection", (socket) => {
    socket.on("join-room", ({ roomId, userId }) => {
      if (roomId && userId) {
        socket.join(roomId);
        socket.data.userId = userId;
        socket.to(roomId).emit("user-joined", { userId, roomId });
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
