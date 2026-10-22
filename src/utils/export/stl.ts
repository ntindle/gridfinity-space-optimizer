import { meshCorner, triangleCount, triangleNormal, type Mesh } from "./mesh";

const HEADER_BYTES = 80;
const TRIANGLE_BYTES = 50;

const stlHeader = (name: string): Uint8Array => {
  const header = new Uint8Array(HEADER_BYTES).fill(0x20);
  const text = `Gridfinity Layout: ${name}`.replace(/×/g, "x").replace(/[^\x20-\x7e]/g, "?");
  for (let index = 0; index < Math.min(text.length, HEADER_BYTES); index += 1) {
    header[index] = text.charCodeAt(index);
  }
  return header;
};

export const meshToStl = (mesh: Mesh, name: string): Uint8Array => {
  const count = triangleCount(mesh);
  const bytes = new Uint8Array(HEADER_BYTES + 4 + count * TRIANGLE_BYTES);
  bytes.set(stlHeader(name));
  const view = new DataView(bytes.buffer);
  view.setUint32(HEADER_BYTES, count, true);
  let offset = HEADER_BYTES + 4;
  for (let triangle = 0; triangle < count; triangle += 1) {
    const values = [
      ...triangleNormal(mesh, triangle),
      ...meshCorner(mesh, triangle, 0),
      ...meshCorner(mesh, triangle, 1),
      ...meshCorner(mesh, triangle, 2),
    ];
    for (const value of values) {
      view.setFloat32(offset, value, true);
      offset += 4;
    }
    view.setUint16(offset, 0, true);
    offset += 2;
  }
  return bytes;
};
