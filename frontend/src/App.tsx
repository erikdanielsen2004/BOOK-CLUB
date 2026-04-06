import { BrowserRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import './App.css';

import LoginPage from './pages/LoginPage';
import BooksPage from './pages/BooksPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyShelf from './pages/Myshelf';

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
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
