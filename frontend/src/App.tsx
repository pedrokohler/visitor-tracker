import SessionTable from "./components/SessionTable";
import useSessions from "./hooks/useSessions";

function App() {
  const { sessions, averageSessionTime, averageUsersPerCompany } =
    useSessions();

  return (
    <div className="w-full h-full p-4">
      <SessionTable sessions={sessions} />
      <div className="absolute bottom-4">
        <div>Average Session Time: {averageSessionTime} seconds</div>
        <div>Average Users Per Company: {averageUsersPerCompany} users</div>
      </div>
    </div>
  );
}

export default App;
