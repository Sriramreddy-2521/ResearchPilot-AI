import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BookOpen, Map, Settings, LayoutDashboard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Comparison from './pages/Comparison';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#F7F7F5] text-gray-900 font-sans">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white flex flex-col items-start p-4 space-y-2">
          <div className="flex items-center space-x-2 px-2 py-4 mb-4">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">R</div>
            <span className="font-semibold text-lg tracking-tight">ResearchPilot</span>
          </div>

          <Link to="/" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link to="/workspace" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-bg-gray-100 text-sm font-medium text-gray-700 transition-colors">
            <BookOpen size={18} />
            <span>Workspace</span>
          </Link>
          <Link to="/comparison" className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors">
            <Map size={18} />
            <span>Comparison</span>
          </Link>

          <div className="mt-auto w-full pt-4 border-t border-gray-200">
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors">
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/comparison" element={<Comparison />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
