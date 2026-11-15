export const saveFile = (filename: string, data: Uint8Array | string, type: string): void => {
  const blob = new Blob([data as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const nextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => window.setTimeout(resolve, 0));
  });
