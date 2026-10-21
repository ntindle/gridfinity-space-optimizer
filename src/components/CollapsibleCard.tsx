import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  defaultOpen?: boolean;
  tourId?: string;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  defaultOpen = true,
  tourId,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section data-tour={tourId} className="min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="mb-2 flex min-h-[48px] w-full items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2 text-left shadow-xs md:hidden"
      >
        <span className="text-lg font-semibold">{title}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-5 w-5 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      <div id={panelId} className={cn(!open && "hidden", "md:block")}>
        <Card>
          <CardContent>
            <h3 className="hidden text-lg font-semibold md:mb-2 md:block">
              {title}
            </h3>
            {children}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CollapsibleCard;
