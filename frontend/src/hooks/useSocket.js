import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : window.location.origin;

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef;
};
