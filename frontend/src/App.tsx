import SessionTable from "./components/SessionTable";
import useSessions from "./hooks/useSessions";

function App() {
  const { sessions, averageSessionTime, averageUsersPerCompany } =
    useSessions();

  return (
    <div className="w-full h-full p-4">
      <SessionTable sessions={sessions} />
      <div className="fixed bottom-4 bg-blue-100 p-4 opacity-80 font-bold">
        <div>Average Session Time: {averageSessionTime} seconds</div>
        <div>Average Users Per Company: {averageUsersPerCompany} users</div>
      </div>
    </div>
  );
}

export default App;
