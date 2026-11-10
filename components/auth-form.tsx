
"use client";

import { useState } from "react";
import Link from "next/link";

import {
  useRouter,
  useSearchParams
} from "next/navigation";

import { ArrowRight } from "lucide-react";

type Props = {
  mode: "login" | "register";
  cover: string;
};

export function AuthForm({
  mode,
  cover
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/auth/${mode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not continue"
        );
      }

      const path = params.get("next");

      router.push(
        path?.startsWith("/") &&
        !path.startsWith("//")
          ? path
          : "/account"
      );

      router.refresh();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Authentication failed"
      );

      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <div
        className="auth-art"
        style={{
          backgroundImage:
            `linear-gradient(150deg, #121212db, #111111a0), url("${cover}")`
        }}
      >
        <div>
          <p className="eyebrow light">
            ACCESS THE CULTURE
          </p>

          <h2>
            YOU GET
            <br />
            WHAT YOU
            <br />
            <i>DESERVE.</i>
          </h2>

          <p>
            THIS IS KARMA CURATED.
          </p>
        </div>
      </div>

      <div className="auth-form-wrap">
        <Link
          className="eyebrow"
          href="/"
        >
          ← BACK TO KARMA CURATED
        </Link>

        <h1>
          {mode === "login"
            ? "WELCOME BACK."
            : "JOIN THE MOVEMENT."}
        </h1>

        <p className="auth-sub">
          {mode === "login"
            ? "Pick up where you left off."
            : "Create your account to track purchases and events."}
        </p>

        <form
          onSubmit={submit}
          className="auth-fields"
        >
          {mode === "register" && (
            <label>
              FULL NAME
              <input
                required
                minLength={2}
                autoComplete="name"
                value={form.name}
                onChange={event =>
                  setForm({
                    ...form,
                    name: event.target.value
                  })
                }
              />
            </label>
          )}

          <label>
            EMAIL ADDRESS
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={event =>
                setForm({
                  ...form,
                  email: event.target.value
                })
              }
            />
          </label>

          <label>
            PASSWORD
            <input
              type="password"
              required
              minLength={
                mode === "register" ? 10 : 1
              }
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              value={form.password}
              onChange={event =>
                setForm({
                  ...form,
                  password: event.target.value
                })
              }
            />
          </label>

          {error && (
            <p
              className="error-msg"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="btn orange fill"
            disabled={busy}
          >
            {busy
              ? "PLEASE WAIT..."
              : mode === "login"
                ? "SIGN IN"
                : "CREATE ACCOUNT"}

            <ArrowRight size={18} />
          </button>
        </form>

        <p className="switch-auth">
          {mode === "login"
            ? "Don't have an account? "
            : "Already registered? "}

          <Link
            href={
              mode === "login"
                ? "/register"
                : "/login"
            }
          >
            {mode === "login"
              ? "JOIN KARMA CURATED"
              : "SIGN IN"}
          </Link>
        </p>
      </div>
    </main>
  );
}
