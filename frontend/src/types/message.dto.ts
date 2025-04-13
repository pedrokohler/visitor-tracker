import { SessionDto } from "./session.dto";

export enum MessageType {
  CLOSED = "closed",
  EXPIRED = "expired",
  OPENED = "opened",
  REFRESHED = "refreshed",
}

export type MessageDto = {
  key: string;
  type: MessageType;
  session: SessionDto;
};
