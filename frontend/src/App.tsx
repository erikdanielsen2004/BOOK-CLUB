import { BrowserRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import './App.css';

import LoginPage from './pages/LoginPage.tsx';
import BooksPage from './pages/BooksPage.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import MyShelf from './pages/Myshelf.tsx';
import VerifyEmail from './pages/VerifyEmail.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"         element={<LoginPage />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/books"    element={<BooksPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/myshelf"   element={<MyShelf />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
