import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.tsx";
import { socket, WebSocketProvider } from "./contexts/WebSocket.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WebSocketProvider value={socket}>
      <App />
    </WebSocketProvider>
  </StrictMode>
);
