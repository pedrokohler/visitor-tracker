import { AnimatePresence } from "framer-motion";
import Table from "react-bootstrap/Table";
import SessionRow from "./SessionRow";
import { Session } from "../types";

function SessionTable({ sessions }: { sessions: Session[] }) {
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>#</th>
          <th>IP</th>
          <th>Time since first seen (s)</th>
          <th>Time since last activity (s)</th>
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
