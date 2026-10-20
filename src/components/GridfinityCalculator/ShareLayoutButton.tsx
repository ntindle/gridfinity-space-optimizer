import React, { useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { buildShareUrl } from '@/utils/shareLayout';

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

  return (
    <div className="flex flex-wrap items-center gap-2" data-tour="share">
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
        title="Copy a link that opens this exact layout"
        aria-label="Copy share link for this layout"
      >
        {status === 'copied' ? (
          <Check className="mr-2 h-4 w-4" aria-hidden="true" />
        ) : (
          <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {status === 'copied' ? 'Link copied!' : 'Copy share link'}
      </Button>
      <span className="text-sm text-muted-foreground" role="status">
        {status === 'copied'
          ? 'Send this link — it opens your exact layout.'
          : status === 'error'
            ? 'Copy failed — select the link below and copy it manually.'
            : 'Share this exact layout with one link.'}
      </span>
      {failedUrl && (
        <input
          type="text"
          readOnly
          value={failedUrl}
          aria-label="Share link — select and copy manually"
          onFocus={(e) => e.target.select()}
          className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      )}
    </div>
  );
};

export default ShareLayoutButton;
