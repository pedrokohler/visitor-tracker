import { createContext } from "react";
import { io, Socket } from "socket.io-client";

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

export const socket = io(WEBSOCKET_URL);
export const WebSocketContext = createContext<Socket>(socket);
export const WebSocketProvider = WebSocketContext.Provider;
