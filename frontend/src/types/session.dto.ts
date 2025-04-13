import { Company, Contact } from "./";

export type SessionDto = {
  ip: string;
  firstTimeSeenUTC: number;
  lastActivityUTC: number;
  timesRefreshed: number;
  contact: null | Contact;
  company: null | Company;
};
