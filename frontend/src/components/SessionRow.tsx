import { motion } from "framer-motion";
import { Session } from "../types";

function SessionRow({ session, index }: { session: Session; index: number }) {
  return (
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
      <td>{index}</td>
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
  );
}

export default SessionRow;
