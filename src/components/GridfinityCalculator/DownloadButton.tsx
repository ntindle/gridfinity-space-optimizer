import React, { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { nextPaint, saveFile } from "@/utils/download";
import { pluralize } from "@/utils/format";
import type { Bin, DrawerSize, LayoutItem, PrinterSize } from "@/types";

interface DownloadButtonProps {
  layout: LayoutItem[];
  bins: Bin[];
  numDrawers: number;
  drawerSize: DrawerSize;
  useMm: boolean;
  printerName: string;
  printerSize: PrinterSize;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  layout,
  bins,
  numDrawers,
  drawerSize,
  useMm,
  printerName,
  printerSize,
}) => {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const [{ createPrintFiles }] = await Promise.all([
        import("@/utils/export/exportFiles"),
        nextPaint(),
      ]);
      const bundle = createPrintFiles({
        layout,
        bins,
        numDrawers,
        drawerSize,
        useMm,
        printerName,
        printerSize,
      });
      saveFile(bundle.filename, bundle.data, "application/zip");
      const skipped =
        bundle.skippedBins > 0
          ? ` ${pluralize(bundle.skippedBins, "bin")} with a problem ${bundle.skippedBins === 1 ? "was" : "were"} left out.`
          : "";
      toast.success(`Downloaded ${bundle.filename}`, {
        description: `${pluralize(bundle.parts, "part")} as STL files and ${pluralize(bundle.prints, "print")} as 3MF plates.${skipped}`,
      });
    } catch (error) {
      toast.error("Couldn't create the files", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleDownload}
      aria-busy={busy}
      data-tour="download"
      title="Every bin, baseplate, and spacer as STL files and ready-to-slice 3MF plates"
    >
      {busy ? (
        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
      ) : (
        <Download />
      )}
      Download files
      <span className="sr-only"> (STL and 3MF, zipped)</span>
    </Button>
  );
};

export default DownloadButton;
