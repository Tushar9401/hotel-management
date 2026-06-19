import React, { useState } from "react";
import { Check, LockKeyhole, LogIn, Sparkles, UserRound } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useHotel } from "../context/HotelContext";

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useHotel();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === "admin" ? "/dashboard" : "/staff"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const authenticatedUser = await login(username.trim(), password);
      navigate(authenticatedUser.role === "admin" ? "/dashboard" : "/staff");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="visual-orb orb-one" />
        <div className="visual-orb orb-two" />
        <Logo light />
        <div className="visual-copy">
          <span className="eyebrow light">
            <Sparkles size={15} /> Hotel operations, simplified
          </span>
          <h1>Every room ready.<br />Every detail covered.</h1>
          <p>
            Keep your front desk and housekeeping team perfectly in sync,
            from assignment to final check.
          </p>
          <div className="visual-points">
            <span><Check size={16} /> Real-time room status</span>
            <span><Check size={16} /> Clear task accountability</span>
            <span><Check size={16} /> Faster room turnaround</span>
          </div>
        </div>
        <div className="visual-footer">Thoughtful stays begin behind the scenes.</div>
      </section>

      <section className="login-panel">
        <div className="login-mobile-logo"><Logo /></div>
        <div className="login-card">
          <span className="eyebrow">Welcome to Roomly</span>
          <h2>Sign in to your workspace</h2>
          {/* <p className="login-intro">Your dashboard is selected from the role assigned in Django.</p> */}

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>Username</span>
              <div><UserRound size={18} /><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" autoComplete="username" required /></div>
            </label>
            <label className="login-field">
              <span>Password</span>
              <div><LockKeyhole size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password" required /></div>
            </label>
            {error && <p className="login-error">{error}</p>}
            <button className="button primary full login-submit" disabled={submitting}>
              <LogIn size={18} /> {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
{/* 
          <div className="demo-credentials">
            <strong>Demo accounts</strong>
            <span>Admin: <code>ava / admin123</code></span>
            <span>Room service: <code>maya / staff123</code></span>
          </div> */}
        </div>
      </section>
    </main>
  );
}
