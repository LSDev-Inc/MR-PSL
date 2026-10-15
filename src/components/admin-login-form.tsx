"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Accesso non riuscito.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Impossibile raggiungere il servizio. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}
      <label>
        Email amministratore
        <input
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          value={email}
          onChange={event => setEmail(event.target.value)}
        />
      </label>
      <label>
        Password
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={256}
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            onClick={() => setShowPassword(current => !current)}
          >
            {showPassword ? "Nascondi" : "Mostra"}
          </button>
        </div>
      </label>
      <button className="button button-blue" type="submit" disabled={busy}>
        {busy ? "Verifica in corso…" : "Accedi"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
