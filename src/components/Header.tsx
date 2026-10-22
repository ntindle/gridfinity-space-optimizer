import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon, LogoMark } from "@/components/icons";

const REPO_URL = "https://github.com/ntindle/gridfinity-space-optimizer";
const SPONSOR_URL = "https://github.com/sponsors/ntindle";

const Header = () => {
  return (
    <header className="border-b border-border/70 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="/"
          className="-mx-1.5 flex items-center gap-2.5 rounded-md px-1.5 py-1 text-[15px] font-semibold tracking-[-0.015em] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark className="size-6 text-foreground" />
          Gridfinity Layout
        </a>
        <nav aria-label="Project" className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <GithubIcon />
              <span className="max-sm:sr-only">GitHub</span>
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={SPONSOR_URL} target="_blank" rel="noreferrer">
              <Heart />
              <span className="max-sm:sr-only">Donate</span>
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
