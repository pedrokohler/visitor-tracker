import { AnimatePresence } from "framer-motion";
import Table from "react-bootstrap/Table";
import SessionRow from "./SessionRow";
import { Session } from "../types";

function SessionTable({ sessions }: { sessions: Session[] }) {
  return (
    <Table className="w-full" striped bordered hover>
      <thead className="text-center">
        <tr>
          <th>#</th>
          <th>IP</th>
          <th>Seconds since first seen</th>
          <th>Seconds since last activity</th>
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
            <SessionRow session={session} index={i} />
          ))}
        </AnimatePresence>
      </tbody>
    </Table>
  );
}

export default SessionTable;
