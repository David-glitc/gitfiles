#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sizes = [512, 256, 128];

for (const size of sizes) {
  const svg = readFileSync(join(root, "public/logo.svg"), "utf8");
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "#000000",
  }).render().asPng();
  const out = join(root, "public", `logo-${size}.png`);
  writeFileSync(out, png);
  console.log(`Wrote ${out} (${size}×${size})`);
}
