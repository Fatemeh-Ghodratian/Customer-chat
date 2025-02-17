import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ClientWidget from "./components/ClientWidget";
import AgentDashboard from "./components/AgentDashboard";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/client" element={<ClientWidget />} />
        <Route path="/webapp" element={<AgentDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;