import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import BookThumbnail from "../components/BookThumbnail.tsx";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__inner">
        <div className="login-page__right">
          <div className="login-card">
            <h2 className="login-card__title">Log In</h2>

            {error && (
              <div className="login-card__error">{error}</div>
            )}

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

              <div className="login-card__field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Type in your password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <p className="login-card__forgot">
                <Link to="/forgot-password">Forgot Password?</Link>
              </p>

              <button
                type="submit"
                className="login-card__btn"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Continue"}
              </button>
            </form>

            <p className="login-card__footer">
              Don't have an account?{" "}
              <Link to="/register">Sign up</Link>
              <br /><br />
              <Link to="/">Back to Main</Link>
            </p>
          </div>
        </div>
      </div>

      <BookThumbnail isLoginPage={true} />
    </div>
  );
};

export default Login;
