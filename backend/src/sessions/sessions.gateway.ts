import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { OnEvent } from '@nestjs/event-emitter';

import { Events } from '../events';
@WebSocketGateway()
export class SessionsGateway {
  constructor() {}

  @WebSocketServer()
  server: WebSocket;

  @OnEvent(Events.SESSIONS_EMITTER_SESSION_CHANGED)
  handleSessionChangedEvent(payload: any) {
    this.server.emit('session_changed', payload);
  }
}
