import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  Layers, 
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  generateExportData, 
  generateTextSummary, 
  copyToClipboard,
  type ExportData,
  type StackablePrint 
} from '@/services/exportService';
import type { GridfinityResult, PrinterSize } from '@/types';

interface ExportPanelProps {
  result: GridfinityResult;
  printerSize: PrinterSize;
  numDrawers: number;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ 
  result, 
  printerSize, 
  numDrawers 
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const exportData = useMemo<ExportData>(() => {
    return generateExportData(result, printerSize, numDrawers);
  }, [result, printerSize, numDrawers]);
  
  const handleCopyToClipboard = async () => {
    const text = generateTextSummary(exportData);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleDownloadText = () => {
    const text = generateTextSummary(exportData);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gridfinity-print-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (exportData.prints.length === 0) {
    return null;
  }
  
  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Export Stackable Prints</h3>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="gap-1"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy print list to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadText}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download as text file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {exportData.summary}
        </p>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-between mb-4"
        >
          <span>
            {expanded ? 'Hide' : 'Show'} detailed stacking instructions
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {expanded && (
          <div className="space-y-4">
            {exportData.prints.map((print) => (
              <PrintCard key={print.id} print={print} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PrintCardProps {
  print: StackablePrint;
}

const PrintCard: React.FC<PrintCardProps> = ({ print }) => {
  const typeLabel = print.type === 'baseplate' 
    ? 'Baseplate' 
    : print.type === 'half-size' 
      ? 'Half-size Bin' 
      : 'Spacer';
  
  const typeColor = print.type === 'baseplate'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : print.type === 'half-size'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-orange-100 text-orange-800 border-orange-200';
  
  return (
    <div className={`p-4 rounded-lg border ${typeColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-semibold">{typeLabel}</span>
          <span className="text-lg ml-2">{print.width}x{print.height}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">
            {print.quantity} needed
          </div>
          <div className="text-xs opacity-75">
            Max {print.maxStack} per stack
          </div>
        </div>
      </div>
      
      <div className="text-sm mb-3">
        <Layers className="h-4 w-4 inline mr-1" />
        {print.leftoverItems > 0 && print.recommendedStacks > 1 ? (
          <span>
            Print <strong>{print.recommendedStacks - 1}</strong> stack(s) of{' '}
            <strong>{print.itemsPerStack}</strong>, then{' '}
            <strong>1</strong> stack of <strong>{print.leftoverItems}</strong>
          </span>
        ) : (
          <span>
            Print <strong>{print.recommendedStacks}</strong> stack(s) of{' '}
            <strong>{print.itemsPerStack}</strong>
          </span>
        )}
      </div>
      
      {print.modelLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {print.modelLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/50 hover:bg-white/80 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {link.platform}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportPanel;
