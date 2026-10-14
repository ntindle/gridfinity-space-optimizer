import React, { useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { buildShareUrl } from '@/utils/shareLayout';

/**
 * One-click "Copy share link" button.
 *
 * Encodes the current drawer / printer / bin settings into a `?share=` URL
 * and copies it to the clipboard, so a layout can be sent to someone else
 * instead of re-typed. Falls back to the legacy execCommand path when the
 * async clipboard API is unavailable (older browsers, non-secure contexts).
 */
const ShareLayoutButton: React.FC = () => {
  const settings = useSettings();
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const flashStatus = (next: 'copied' | 'error') => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus('idle'), 2500);
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
    }
    document.body.removeChild(textarea);
    return ok;
  };

  const handleCopy = async () => {
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
        flashStatus('error');
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      <span className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {status === 'copied'
          ? 'Send this link — it opens your exact layout.'
          : status === 'error'
            ? 'Couldn’t copy the link — copy it from the address bar after sharing this page.'
            : 'Share this exact layout with one link.'}
      </span>
    </div>
  );
};

export default ShareLayoutButton;
