export enum SessionsEmitterEventType {
  OPENED = 'session-opened',
  CLOSED = 'session-closed',
  KEEP_ALIVE = 'keep-alive',
}

export type SessionsEmitterMessage = {
  eventType: SessionsEmitterEventType;
  ip: string;
  guid: string;
  timestamp: string;
};
