import { createContext } from "react";
import { io, Socket } from 'socket.io-client';


const WEBSOCKET_URL = 'ws://localhost:3000';

export const socket = io(WEBSOCKET_URL);
export const WebSocketContext = createContext<Socket>(socket);
export const WebSocketProvider = WebSocketContext.Provider;