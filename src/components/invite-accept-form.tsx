"use client";

import { useEffect, useState } from "react";

export function InviteAcceptForm() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    setToken(value);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("Il link non contiene un invito valido.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/accept-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Non è stato possibile completare la procedura.");
        return;
      }
      setDone(true);
      setToken("");
      setPassword("");
      setConfirm("");
    } catch {
      setError("Servizio non disponibile. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="invite-done" role="status">
        <h2>Account configurato.</h2>
        <p>Ora puoi accedere all’area riservata con la tua nuova password.</p>
        <a className="button button-blue" href="/admin/login">
          Vai all’accesso <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  return (
    <form className="admin-form" onSubmit={submit}>
      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}
      <label>
        Nuova password
        <input
          type="password"
          autoComplete="new-password"
          minLength={14}
          maxLength={128}
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </label>
      <small className="password-rules">Almeno 14 caratteri con maiuscole, minuscole, numeri e simboli.</small>
      <label>
        Conferma password
        <input
          type="password"
          autoComplete="new-password"
          minLength={14}
          maxLength={128}
          required
          value={confirm}
          onChange={event => setConfirm(event.target.value)}
        />
      </label>
      <button className="button button-blue" type="submit" disabled={busy || !token}>
        {busy ? "Configurazione…" : "Imposta password"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
