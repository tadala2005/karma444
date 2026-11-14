"use client";

import {
  useState
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams
} from "next/navigation";

import {
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

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

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [visible, setVisible] =
    useState(false);

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
          data.error ||
          "Authentication failed."
        );
      }

      const path =
        params.get("next");

      const safePath =
        path?.startsWith("/") &&
        !path.startsWith("//") &&
        !path.startsWith("/\\");

      router.push(
        safePath
          ? path!
          : "/account"
      );

      router.refresh();

    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Authentication failed."
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
            : "Create an account to track orders and event registrations. Shopping as a guest does not require an account."}
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
                maxLength={100}
                autoComplete="name"
                value={form.name}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    name: event.target.value
                  }))
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
                setForm(previous => ({
                  ...previous,
                  email: event.target.value
                }))
              }
            />
          </label>

          <label>
            PASSWORD

            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative"
              }}
            >
              <input
                type={
                  visible
                    ? "text"
                    : "password"
                }
                required
                minLength={
                  mode === "register"
                    ? 10
                    : 1
                }
                maxLength={
                  mode === "register"
                    ? 128
                    : undefined
                }
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                value={form.password}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    password:
                      event.target.value
                  }))
                }
                style={{
                  paddingRight: 58
                }}
              />

              <button
                type="button"
                aria-label={
                  visible
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setVisible(!visible)
                }
                style={{
                  position: "absolute",
                  right: 10,
                  background: "transparent",
                  border: 0,
                  padding: 8,
                  cursor: "pointer"
                }}
              >
                {visible ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {mode === "register" && (
              <small
                style={{
                  fontSize: 11,
                  color: "#777",
                  letterSpacing: 0,
                  lineHeight: 1.6
                }}
              >
                Minimum 10 characters.
                A longer, unique passphrase
                is recommended. Symbols are
                optional.
              </small>
            )}
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

        {mode === "register" && (
          <Link
            href="/shop"
            className="plain-back"
          >
            CONTINUE SHOPPING AS A GUEST
            <ArrowRight size={16} />
          </Link>
        )}

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
