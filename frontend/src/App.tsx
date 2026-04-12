import { BrowserRouter as Router, Route, Navigate, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './App.css';

const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const BooksPage = lazy(() => import('./pages/BooksPage.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Register = lazy(() => import('./pages/Register.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const MyShelf = lazy(() => import('./pages/Myshelf.tsx'));
const MyGroups = lazy(() => import('./pages/MyGroups.tsx'));
const Reviews = lazy(() => import('./pages/Reviews.tsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.tsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.tsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.tsx'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: "2rem", fontFamily: "monospace" }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/myshelf" element={<MyShelf />} />
          <Route path="/groups" element={<MyGroups />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
