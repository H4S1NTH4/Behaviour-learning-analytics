/**
 * Main App Component
 *
 * Root component that sets up routing and global state
 * for the behavioral analytics dashboard.
 *
 * @module App
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SessionView from './pages/SessionView';
import UserView from './pages/UserView';
import './styles/App.css';

/**
 * App Component
 */
export const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Home - Default Dashboard */}
          <Route
            path="/"
            element={<Dashboard userId="default-user" />}
          />

          {/* Session View */}
          <Route path="/session/:sessionId" element={<SessionView />} />

          {/* User View */}
          <Route path="/user/:userId" element={<UserView />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
