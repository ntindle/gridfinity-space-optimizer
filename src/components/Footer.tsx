import React from "react";
import { LogoMark } from "@/components/icons";

const LINKS = [
  { label: "GitHub", href: "https://github.com/ntindle/gridfinity-space-optimizer" },
  { label: "Donate", href: "https://github.com/sponsors/ntindle" },
  {
    label: "License",
    href: "https://github.com/ntindle/gridfinity-space-optimizer/blob/main/LICENSE",
  },
];

const linkClass =
  "rounded-sm underline decoration-transparent underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-current focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring";

const Footer = () => {
  return (
    <footer className="border-t border-border/70 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-4 py-8 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <LogoMark className="size-4 text-foreground" />
          <span>
            © {new Date().getFullYear()} Gridfinity Layout · Open source under
            MIT
          </span>
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={linkClass}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#accessibility" className={linkClass}>
                Accessibility statement
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
