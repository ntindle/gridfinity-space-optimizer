import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CollapsibleCard from "@/components/CollapsibleCard";
import { EXAMPLE_PROJECTS, type ExampleProject } from "@/lib/exampleProjects";
import { trackLayoutLoaded } from "@/services/analytics";
import { unitMath } from "@/services/unitMath";
import { drawerSizeMm, formatDrawerSize, pluralize } from "@/utils/format";
import type { SavedLayoutSnapshot } from "@/utils/savedLayouts";

interface ExampleLayoutsProps {
  onRestore: (snapshot: SavedLayoutSnapshot) => void;
}

const percentOf = (value: number, total: number): number =>
  unitMath.multiply(unitMath.divide(value, total), 100);

const ExamplePlanPreview: React.FC<{ example: ExampleProject }> = React.memo(
  ({ example }) => {
    const drawer = drawerSizeMm(example.snapshot.drawerSize);
    return (
      <div
        aria-hidden="true"
        className="drawer-floor relative w-full overflow-hidden rounded-md"
        style={{ aspectRatio: `${drawer.width} / ${drawer.height}` }}
      >
        {example.snapshot.bins.map((bin) => (
          <span
            key={bin.id}
            title={bin.label}
            className="absolute"
            style={{
              left: `${percentOf(bin.x, drawer.width)}%`,
              top: `${percentOf(bin.y, drawer.height)}%`,
              width: `${percentOf(bin.width, drawer.width)}%`,
              height: `${percentOf(bin.depth, drawer.height)}%`,
              backgroundColor: "var(--plate)",
              boxShadow: "inset 0 0 0 1px var(--plate-edge)",
            }}
          />
        ))}
      </div>
    );
  }
);

ExamplePlanPreview.displayName = "ExamplePlanPreview";

const ExampleLayouts: React.FC<ExampleLayoutsProps> = ({ onRestore }) => {
  const handleLoad = (example: ExampleProject) => {
    trackLayoutLoaded("example", example.snapshot);
    onRestore(example.snapshot);
    toast.success(`Opened "${example.name}"`, {
      description: "It replaces the current layout.",
    });
  };

  return (
    <CollapsibleCard
      title="Example layouts"
      summary={pluralize(EXAMPLE_PROJECTS.length, "example drawer")}
      defaultOpen={false}
      className="border-t"
    >
      <p className="text-[13px] leading-snug text-muted-foreground">
        Start from a real drawer. Loading an example replaces the current
        layout, and you can still edit every size and bin after.
      </p>
      <ul className="mt-3 space-y-3">
        {EXAMPLE_PROJECTS.map((example) => (
          <li key={example.id} className="rounded-lg border border-border/70 p-3">
            <ExamplePlanPreview example={example} />
            <p className="mt-2.5 text-sm font-medium">{example.name}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              {example.description}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              {formatDrawerSize(example.snapshot.drawerSize, example.snapshot.useMm)}
              {" · "}
              {pluralize(example.snapshot.bins.length, "bin")}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              Sized for{" "}
              <a
                href={example.drawerSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {example.drawerSource}
              </a>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2.5 w-full"
              aria-label={`Load ${example.name}`}
              onClick={() => handleLoad(example)}
            >
              Load
            </Button>
          </li>
        ))}
      </ul>
    </CollapsibleCard>
  );
};

export default ExampleLayouts;
