import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import "../styles/Register.css";

const Register: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail]               = useState("");
  const [firstName, setFirstName]       = useState("");
  const [lastName, setLastName]         = useState("");
  const [passwordHash, setPasswordHash] = useState("");
  const [confirmPassword, setConfirm]   = useState("");
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordHash !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // signup for user but havent actually tested
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, passwordHash }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/login"); //after signup -> login page
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <NavBar />

      {/* will change to match the second figma just place holder for now */}

      <div className="register-page__inner">
        {/* Left */}
        <div className="register-page__left">
          <h1 className="register-page__heading">
            Welcome<br />
            to the<br />
            Book Club!
          </h1>
        </div>

        {/* Right — sign up card */}
        <div className="register-page__right">
          <div className="register-card">
            <h2 className="register-card__title">Sign Up</h2>

            {error && (
              <div className="register-card__error">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="register-card__form">
              <div className="register-card__field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="register-card__field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="register-card__field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="register-card__field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={passwordHash}
                  onChange={(e) => setPasswordHash(e.target.value)}
                  required
                />
              </div>

              <div className="register-card__field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="register-card__btn"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="register-card__footer">
              Already have an account?{" "}
              <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
