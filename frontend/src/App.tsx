import { BrowserRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import './App.css';

import LoginPage from './pages/LoginPage';
import BooksPage from './pages/BooksPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;