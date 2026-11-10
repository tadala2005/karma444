
"use client";

import Link from "next/link";

import {
  usePathname
} from "next/navigation";

import {
  ShoppingBag,
  Menu,
  X,
  ArrowUpRight,
  UserCircle2
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import { useCart } from "./cart-store";

const links = [
  ["/artists", "ARTISTS"],
  ["/culture", "CULTURE"],
  ["/events", "EVENTS"],
  ["/shop", "SHOP"],
  ["/studio", "STUDIO"]
];

export function Header() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const items = useCart(
    state => state.items
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const count = mounted
    ? items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      )
    : 0;

  return (
    <>
      <div className="topline">
        <span>
          KARMA CURATED / INDEPENDENT CULTURE FROM MALAWI
        </span>

        <span className="topline-right">
          MUSIC · STYLE · EVENTS · PEOPLE
          {" "}
          <span className="dot">●</span>
          {" "}
          WHAT YOU DESERVE
        </span>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <Link
            className="wordmark"
            href="/"
            aria-label="Karma Curated homepage"
          >
            KARMA
            <span className="wordmark-curated">
              CURATED
            </span>
            <span className="brand-dot">
              .
            </span>
          </Link>

          <nav
            className="desktop-nav"
            aria-label="Main navigation"
          >
            {links.map(([url, title]) => (
              <Link
                key={url}
                href={url}
                className={
                  pathname.startsWith(url)
                    ? "active"
                    : ""
                }
              >
                {title}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link
              href="/account"
              aria-label="Account"
              className="icon-link"
            >
              <UserCircle2 size={20} />
            </Link>

            <Link
              href="/cart"
              className="bag-link"
              aria-label={`Shopping bag: ${count} items`}
            >
              <ShoppingBag size={19} />

              <span className="bag-count">
                {count}
              </span>
            </Link>

            <button
              type="button"
              className="menu-btn"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() =>
                setOpen(!open)
              }
            >
              {open ? (
                <X size={23} />
              ) : (
                <Menu size={23} />
              )}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <nav
          className="mobile-menu"
          aria-label="Mobile navigation"
        >
          {links.map(([url, title]) => (
            <Link
              key={url}
              href={url}
            >
              {title}
              <ArrowUpRight size={20} />
            </Link>
          ))}

          <Link href="/account">
            MY ACCOUNT
            <ArrowUpRight size={20} />
          </Link>
        </nav>
      )}
    </>
  );
}
