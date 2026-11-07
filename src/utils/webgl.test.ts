/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { supportsWebGL } from "./webgl";

describe("supportsWebGL", () => {
  it("returns a boolean and is false where jsdom has no WebGL", () => {
    expect(supportsWebGL()).toBe(false);
  });
});
