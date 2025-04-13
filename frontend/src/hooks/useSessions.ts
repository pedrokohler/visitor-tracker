import { useCallback, useContext, useEffect, useState } from "react";
import { useInterval } from "usehooks-ts";
import { WebSocketContext } from "../contexts/WebSocket";
import { Session, MessageDto, MessageType, SessionDto } from "../types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const roundNumber = (number: number, decimalPlaces: number = 0) => {
  return Math.round(number * 10 ** decimalPlaces) / 10 ** decimalPlaces;
};

function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [averageSessionTime, setAverageSessionTime] = useState(0);
  const [averageUsersPerCompany, setAverageUsersPerCompany] = useState(0);
  const socket = useContext(WebSocketContext);

  const adaptSession = useCallback((session: SessionDto) => {
    return {
      ...session,
      secondsSinceFirstSeen: roundNumber(
        (Date.now() - session.firstTimeSeenUTC) / 1000
      ),
      secondsSinceLastActivity: roundNumber(
        (Date.now() - session.lastActivityUTC) / 1000
      ),
    };
  }, []);

  const removeSessionWithDelay = useCallback((ip: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.ip === ip ? { ...session, removing: true } : session
      )
    );

    setTimeout(() => {
      setSessions((prev) => prev.filter((session) => session.ip !== ip));
    }, 1000);
  }, []);

  const addSessionsWithDelay = useCallback(
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

    socket.on("session_changed", (payload: MessageDto) => {
      if ([MessageType.CLOSED, MessageType.EXPIRED].includes(payload.type)) {
        return removeSessionWithDelay(payload.key);
      }

      if (payload.type === MessageType.OPENED) {
        return addSessionsWithDelay(adaptSession(payload.session));
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
      socket.off("session_changed");
    };
  }, [socket, adaptSession, removeSessionWithDelay, addSessionsWithDelay]);

  useEffect(() => {
    const identifiedCompanies = new Set();
    let usersFromIdentifiedCompanies = 0;
    let totalSessionTime = 0;
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      totalSessionTime += session.secondsSinceFirstSeen;

      if (session.company) {
        const key = session.company.guid;
        identifiedCompanies.add(key);
        usersFromIdentifiedCompanies++;
      }
    }

    const averageSessionTime = roundNumber(
      totalSessionTime / sessions.length,
      1
    );
    setAverageSessionTime(averageSessionTime || 0);

    const averageUsersPerCompany = roundNumber(
      usersFromIdentifiedCompanies / identifiedCompanies.size,
      2
    );
    setAverageUsersPerCompany(averageUsersPerCompany || 0);
  }, [sessions]);

  useInterval(() => {
    setSessions((prev) => prev.map(adaptSession));
  }, 1000);

  useEffect(() => {
    const fetchOpenSessions = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/sessions`);
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

  return {
    sessions,
    averageSessionTime,
    averageUsersPerCompany,
  };
}

export default useSessions;
