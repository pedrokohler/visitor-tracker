import { useCallback, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterval } from "usehooks-ts";
import { WebSocketContext } from "./contexts/WebSocket";
import Table from "react-bootstrap/Table";

enum CHANGE_TYPE {
  CLOSED = "closed",
  EXPIRED = "expired",
  OPENED = "opened",
  REFRESHED = "refreshed",
}

export type Contact = {
  guid: string;
  name: string;
  title?: string;
  emailAddresses?: string[];
  phoneNumbers?: string[];
};

export type Company = {
  guid: string;
  name: string;
  domain: string;
};

type SessionDto = {
  ip: string;
  firstTimeSeenUTC: number;
  lastActivityUTC: number;
  timesRefreshed: number;
  contact: null | Omit<Contact, "guid">;
  company: null | Omit<Company, "guid">;
};

type Session = SessionDto & {
  secondsSinceFirstSeen: number;
  secondsSinceLastActivity: number;
  removing?: boolean;
  adding?: boolean;
};

const SERVER_URL = "http://localhost:3000/sessions";

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [averageSessionTime, setAverageSessionTime] = useState(0);
  const [averageUsersPerCompany, setAverageUsersPerCompany] = useState(0);
  const socket = useContext(WebSocketContext);

  const adaptSession = useCallback((session: SessionDto) => {
    return {
      ...session,
      secondsSinceFirstSeen: Math.round(
        (Date.now() - session.firstTimeSeenUTC) / 1000
      ),
      secondsSinceLastActivity: Math.round(
        (Date.now() - session.lastActivityUTC) / 1000
      ),
    };
  }, []);

  const removeSessionWithAnimation = useCallback((ip: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.ip === ip ? { ...session, removing: true } : session
      )
    );

    setTimeout(() => {
      setSessions((prev) => prev.filter((session) => session.ip !== ip));
    }, 1000);
  }, []);

  const addSessionsWithAnimation = useCallback(
    (session: Session) => {
      setSessions((prev) => [
        ...prev,
        { ...adaptSession(session), adding: true },
      ]);

      setTimeout(() => {
        setSessions((prev) =>
          prev.map((s) => (s.ip !== session.ip ? s : { ...s, adding: false }))
        );
      }, 1000);
    },
    [adaptSession]
  );

  useEffect(() => {
    socket.on("connect", () => console.log("socket connected"));

    socket.on("message", (payload) => {
      if ([CHANGE_TYPE.CLOSED, CHANGE_TYPE.EXPIRED].includes(payload.type)) {
        return removeSessionWithAnimation(payload.key);
      }

      if (payload.type === CHANGE_TYPE.OPENED) {
        return addSessionsWithAnimation(payload.session);
      }

      setSessions((prev) => {
        const changedIndex = prev.findIndex(
          (session) => session.ip === payload.key
        );
        if (changedIndex === -1) {
          return [...prev, { ...adaptSession(payload.session) }];
        }

        prev[changedIndex] = adaptSession(payload.session);
        return [...prev];
      });
    });

    return () => {
      socket.off("connect");
      socket.off("message");
    };
  }, [
    socket,
    adaptSession,
    removeSessionWithAnimation,
    addSessionsWithAnimation,
  ]);

  useEffect(() => {
    const identifiedCompanies = new Set();
    let usersFromIdentifiedCompanies = 0;
    let totalSessionTime = 0;
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      totalSessionTime += session.secondsSinceFirstSeen;

      if (session.company) {
        const key = session.company.name;
        identifiedCompanies.add(key);
        usersFromIdentifiedCompanies++;
      }
    }

    const averageSessionTime =
      Math.round((totalSessionTime / sessions.length) * 100) / 100;
    setAverageSessionTime(averageSessionTime || 0);

    const averageUsersPerCompany =
      Math.round(
        (usersFromIdentifiedCompanies / identifiedCompanies.size) * 100
      ) / 100;
    setAverageUsersPerCompany(averageUsersPerCompany || 0);
  }, [sessions]);

  useInterval(() => {
    setSessions((prev) => prev.map(adaptSession));
  }, 500);

  useEffect(() => {
    const fetchOpenSessions = async () => {
      try {
        const response = await fetch(SERVER_URL);
        const json = await response.json();
        setSessions(json.map(adaptSession));
      } catch (e: unknown) {
        console.error(
          `failed to fetch initial sessions: ${(e as Error).message}`
        );
      }
    };

    fetchOpenSessions();
  }, [adaptSession]);

  return (
    <div className="w-full h-full p-4">
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>IP</th>
            <th>Time since first seen (ms)</th>
            <th>Time since last activity (ms)</th>
            <th>Company Name</th>
            <th>Company Domain</th>
            <th>Contact Name</th>
            <th>Contact Title</th>
            <th>Contact Emails</th>
            <th>Contact Phone Numbers</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {sessions.map((session, i) => (
              <motion.tr
                key={session.ip}
                initial={{
                  backgroundColor: session.adding ? "#99ff99" : "#ffffff",
                  opacity: session.adding ? 0 : 1,
                }}
                animate={{
                  backgroundColor: session.removing ? "#ff9999" : "#ffffff",
                  opacity: session.removing ? 0 : 1,
                }}
                transition={{ duration: 1 }}
                className="text-center"
              >
                <td>{i}</td>
                <td>{session.ip}</td>
                <td>{session.secondsSinceFirstSeen}</td>
                <td>{session.secondsSinceLastActivity}</td>
                <td>{session.company?.name}</td>
                <td>{session.company?.domain}</td>
                <td>{session.contact?.name}</td>
                <td>{session.contact?.title}</td>
                <td>{JSON.stringify(session.contact?.emailAddresses ?? [])}</td>
                <td>{JSON.stringify(session.contact?.phoneNumbers ?? [])}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </Table>

      <div className="absolute bottom-0">
        <div>Average Session Time: {averageSessionTime} seconds</div>
        <div>Average Users Per Company: {averageUsersPerCompany} users</div>
      </div>
    </div>
  );
}

export default App;
