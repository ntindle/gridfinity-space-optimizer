import { strToU8, zipSync, type Zippable } from "fflate";

const DOS_EPOCH = new Date(1980, 0, 1);
const LEVEL = 3;

export type ZipEntry = readonly [
  name: string,
  contents: Uint8Array | string,
  options?: { store?: boolean },
];

export const createZip = (entries: readonly ZipEntry[]): Uint8Array => {
  const names = new Set(entries.map(([name]) => name));
  if (names.size !== entries.length) throw new Error("Zip entries need unique names");
  const files: Zippable = {};
  for (const [name, contents, options] of entries) {
    const data = typeof contents === "string" ? strToU8(contents) : contents;
    files[name] = [data, { level: options?.store ? 0 : LEVEL }];
  }
  return zipSync(files, { level: LEVEL, mtime: DOS_EPOCH });
};
