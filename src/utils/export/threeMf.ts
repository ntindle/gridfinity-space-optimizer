import { createZip } from "./zip";
import type { Mesh } from "./mesh";

export interface ThreeMfObject {
  name: string;
  mesh: Mesh;
}

export interface ThreeMfItem {
  object: number;
  transform: readonly number[];
}

export interface ThreeMfModel {
  title: string;
  objects: readonly ThreeMfObject[];
  items: readonly ThreeMfItem[];
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>
`;

const RELATIONSHIPS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>
`;

export const translation = (x: number, y: number): number[] => [1, 0, 0, 0, 1, 0, 0, 0, 1, x, y, 0];

export const quarterTurn = (x: number, y: number): number[] => [0, 1, 0, -1, 0, 0, 0, 0, 1, x, y, 0];

const escapeXml = (value: string): string =>
  value
    .replace(/\p{Cc}/gu, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const formatNumber = (value: number): string => String(Math.round(value * 1e6) / 1e6 + 0);

const objectXml = (id: number, { name, mesh }: ThreeMfObject): string => {
  const lines = [`<object id="${id}" type="model" name="${escapeXml(name)}">`, "<mesh>", "<vertices>"];
  for (let index = 0; index < mesh.positions.length; index += 3) {
    lines.push(
      `<vertex x="${formatNumber(mesh.positions[index])}" y="${formatNumber(mesh.positions[index + 1])}" z="${formatNumber(mesh.positions[index + 2])}"/>`
    );
  }
  lines.push("</vertices>", "<triangles>");
  for (let index = 0; index < mesh.triangles.length; index += 3) {
    lines.push(
      `<triangle v1="${mesh.triangles[index]}" v2="${mesh.triangles[index + 1]}" v3="${mesh.triangles[index + 2]}"/>`
    );
  }
  lines.push("</triangles>", "</mesh>", "</object>");
  return lines.join("\n");
};

export const modelXml = ({ title, objects, items }: ThreeMfModel): string => {
  if (items.length === 0) throw new Error("A 3MF plate needs at least one part");
  for (const item of items) {
    if (!Number.isInteger(item.object) || item.object < 0 || item.object >= objects.length) {
      throw new Error("A 3MF build item points at a missing object");
    }
    if (item.transform.length !== 12) throw new Error("A 3MF transform has 12 values");
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
    `<metadata name="Title">${escapeXml(title)}</metadata>`,
    '<metadata name="Application">Gridfinity Layout</metadata>',
    "<resources>",
    ...objects.map((object, index) => objectXml(index + 1, object)),
    "</resources>",
    "<build>",
    ...items.map(
      (item) =>
        `<item objectid="${item.object + 1}" transform="${item.transform.map(formatNumber).join(" ")}"/>`
    ),
    "</build>",
    "</model>",
    "",
  ].join("\n");
};

export const createThreeMf = (model: ThreeMfModel): Uint8Array =>
  createZip([
    ["[Content_Types].xml", CONTENT_TYPES],
    ["_rels/.rels", RELATIONSHIPS],
    ["3D/3dmodel.model", modelXml(model)],
  ]);
