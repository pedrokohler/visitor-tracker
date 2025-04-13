import { SessionDto } from "./session.dto";

export type Session = SessionDto & {
  secondsSinceFirstSeen: number;
  secondsSinceLastActivity: number;
  removing?: boolean;
  adding?: boolean;
};
