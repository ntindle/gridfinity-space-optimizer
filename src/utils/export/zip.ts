import { strToU8, zipSync } from "fflate";

const DOS_EPOCH = new Date(1980, 0, 1);

export type ZipEntry = readonly [name: string, contents: Uint8Array | string];

export const createZip = (entries: readonly ZipEntry[]): Uint8Array => {
  const names = new Set(entries.map(([name]) => name));
  if (names.size !== entries.length) throw new Error("Zip entries need unique names");
  return zipSync(
    Object.fromEntries(
      entries.map(([name, contents]) => [
        name,
        typeof contents === "string" ? strToU8(contents) : contents,
      ])
    ),
    { level: 6, mtime: DOS_EPOCH }
  );
};
