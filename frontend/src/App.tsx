import { BrowserRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import './App.css';

import LoginPage from './pages/LoginPage.tsx';
import BooksPage from './pages/BooksPage.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"         element={<LoginPage />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/books"    element={<BooksPage />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
