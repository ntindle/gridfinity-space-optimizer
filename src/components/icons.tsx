import { cn } from "@/lib/utils";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn(className)}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
      <rect x="5" y="5" width="6.5" height="6.5" rx="1.5" fill="var(--brand)" />
      <rect x="12.5" y="5" width="6.5" height="6.5" rx="1.5" fill="var(--background)" opacity="0.92" />
      <rect x="5" y="12.5" width="6.5" height="6.5" rx="1.5" fill="var(--background)" opacity="0.92" />
      <rect x="12.5" y="12.5" width="6.5" height="6.5" rx="1.5" fill="var(--background)" opacity="0.92" />
    </svg>
  );
}

export { GithubIcon, LogoMark };
