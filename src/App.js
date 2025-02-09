import "./main.css";
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const Map = lazy(() => import("./components/Map"));
const History = lazy(() => import("./components/History"));
function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/PocketGPS" element={<Map />} />
          <Route path="/PocketGPS/history" element={<History />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
