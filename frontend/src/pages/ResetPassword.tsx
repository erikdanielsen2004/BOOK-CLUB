import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../styles/Login.css";
import BookThumbnail from "../components/BookThumbnail.tsx";

const ResetPassword: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/reset/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmNewPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not reset password.");
      }

      setMessage("Password changed successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__inner">
        <div className="login-page__right">
          <div className="login-card">
            <h2 className="login-card__title">Reset Password</h2>

            {error && <div className="login-card__error">{error}</div>}
            {message && <div className="login-card__success">{message}</div>}

            <form onSubmit={handleSubmit} className="login-card__form">
              <div className="login-card__field">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Type in a new password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="login-card__field">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  placeholder="Type in password again..."
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-card__btn"
                disabled={loading}
              >
                {loading ? "Updating..." : "Change Password"}
              </button>
            </form>

            <p className="login-card__footer">
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>

      <BookThumbnail isLoginPage={true} />
    </div>
  );
};

export default ResetPassword;
