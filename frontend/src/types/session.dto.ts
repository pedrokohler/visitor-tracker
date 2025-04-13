import { Company, Contact } from "./";

export type SessionDto = {
  ip: string;
  firstTimeSeenUTC: number;
  lastActivityUTC: number;
  timesRefreshed: number;
  contact: null | Omit<Contact, "guid">;
  company: null | Omit<Company, "guid">;
};
