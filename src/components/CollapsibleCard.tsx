import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  summary?: string;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  tourId?: string;
  className?: string;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  summary,
  action,
  defaultOpen = true,
  tourId,
  className,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section
      data-tour={tourId}
      className={cn("min-w-0 px-4 py-2 md:p-5", className)}
    >
      <div className="flex min-h-11 items-center gap-3 md:min-h-8">
        <button
          type="button"
          data-section-toggle=""
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="-mx-2 flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md px-2 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
        >
          <span className="shrink-0 text-[15px] font-semibold tracking-[-0.01em]">
            {title}
          </span>
          <span className="min-w-0 flex-1 truncate text-right text-sm text-muted-foreground tabular-nums">
            {!open && summary ? summary : null}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none",
              open && "rotate-180"
            )}
          />
        </button>
        <h3 className="hidden flex-1 text-sm font-semibold tracking-[-0.01em] md:block">
          {title}
        </h3>
        {action}
      </div>
      <div
        id={panelId}
        className={cn("pb-2 pt-1 md:pb-0 md:pt-3", !open && "hidden", "md:block")}
      >
        {children}
      </div>
    </section>
  );
};

export default CollapsibleCard;
