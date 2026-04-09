import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Login.css";
import BookThumbnail from "../components/BookThumbnail.tsx";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/reset/send-reset-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not send reset email.");
      }

      setMessage("Password reset email sent. Please check your inbox.");
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__inner">
        <div className="login-page__right">
          <div className="login-card">
            <h2 className="login-card__title">Forgot Password</h2>

            {error && <div className="login-card__error">{error}</div>}
            {message && <div className="login-card__success">{message}</div>}

            <form onSubmit={handleSubmit} className="login-card__form">
              <div className="login-card__field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Type in your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-card__btn"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Email"}
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

export default ForgotPassword;
