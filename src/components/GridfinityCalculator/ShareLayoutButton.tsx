import React, { useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { buildShareUrl } from '@/utils/shareLayout';
import { cn } from '@/lib/utils';

const swap =
  'col-start-1 row-start-1 transition-[opacity,filter,scale] duration-200 ease-out motion-reduce:transition-none';
const hidden = 'opacity-0 blur-[2px] scale-90';

const ShareLayoutButton: React.FC = () => {
  const settings = useSettings();
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const flashStatus = (next: 'copied' | 'error') => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (next === 'copied') {
      resetTimer.current = setTimeout(() => setStatus('idle'), 2500);
    }
  };

  const copyViaFallback = (text: string): boolean => {
    if (typeof document.execCommand !== 'function') return false;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    } finally {
      document.body.removeChild(textarea);
    }
    return ok;
  };

  const handleCopy = async () => {
    setStatus('idle');
    setFailedUrl(null);
    const shareUrl = buildShareUrl(
      `${window.location.origin}${window.location.pathname}`,
      {
        drawerSize: settings.drawerSize,
        selectedPrinter: settings.selectedPrinter,
        customPrinterSize: settings.customPrinterSize,
        useHalfSize: settings.useHalfSize,
        preferHalfSize: settings.preferHalfSize,
        preferUniformBaseplates: settings.preferUniformBaseplates,
        numDrawers: settings.numDrawers,
        useMm: settings.useMm,
      },
    );

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        flashStatus('copied');
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      if (copyViaFallback(shareUrl)) {
        flashStatus('copied');
      } else {
        setFailedUrl(shareUrl);
        flashStatus('error');
      }
    }
  };

  const copied = status === 'copied';

  return (
    <div className="flex flex-col items-end gap-2" data-tour="share">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        title="Copy a link that opens this exact layout"
        aria-label="Copy share link for this layout"
      >
        <span className="grid size-4 place-items-center" aria-hidden="true">
          <Link2 className={cn(swap, copied && hidden)} />
          <Check className={cn(swap, 'text-brand', !copied && hidden)} />
        </span>
        <span className="grid" aria-hidden="true">
          <span className={cn(swap, copied && hidden)}>Share link</span>
          <span className={cn(swap, !copied && hidden)}>Copied</span>
        </span>
      </Button>
      <span
        className={cn(
          'text-[13px]',
          status === 'error' ? 'text-destructive' : 'sr-only'
        )}
        role="status"
      >
        {copied
          ? 'Link copied — it opens your exact layout.'
          : status === 'error'
            ? 'Copy failed — select the link below and copy it manually.'
            : ''}
      </span>
      {failedUrl && (
        <input
          type="text"
          readOnly
          value={failedUrl}
          aria-label="Share link — select and copy manually"
          onFocus={(e) => e.target.select()}
          className="w-full max-w-md rounded-md border border-input bg-card px-3 py-2 text-base md:pointer-fine:text-sm"
        />
      )}
    </div>
  );
};

export default ShareLayoutButton;
