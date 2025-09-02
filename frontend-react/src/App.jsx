import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ApiProvider, useApi } from './lib/ApiContext';
import PostsPage from './pages/Posts';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

function AppContent() {
  const { user, logout } = useApi();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Posts</Link>
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <div className="user-section">
            <span>Welcome, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </nav>
      <Routes>
        <Route path="/" element={user ? <PostsPage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ApiProvider>
      <AppContent />
    </ApiProvider>
  );
}

export default App;