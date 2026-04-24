import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/Login';
import Register from './pages/Register';
import Confirm from './pages/Confirm';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import RemoteKeyboard from './pages/RemoteKeyboard';
import UploadScore from './pages/UploadScore';
import ScoreList from './pages/ScoreList';
import ScoreDetail from './pages/ScoreDetail';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const GOOGLE_CLIENT_ID = "580310498308-plauqutj7aj1n55ua80de22nk67qdta1.apps.googleusercontent.com"; // User should replace this

const App = () => {
  const token = localStorage.getItem('token');

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm/:token" element={<Confirm />} />
          <Route path="/remote-keyboard" element={<RemoteKeyboard />} />

          <Route element={<Layout />}>
            <Route path="/" element={token ? <Navigate to="/practice" /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/practice" element={token ? <Practice /> : <Navigate to="/login" />} />
            <Route path="/upload" element={token ? <UploadScore /> : <Navigate to="/login" />} />
            <Route path="/collection" element={token ? <ScoreList /> : <Navigate to="/login" />} />
            <Route path="/score/:id" element={token ? <ScoreDetail /> : <Navigate to="/login" />} />
          </Route>
        </Routes>
      </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
