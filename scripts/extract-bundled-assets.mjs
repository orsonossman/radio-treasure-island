import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gunzipSync } from "node:zlib";

const sourceFile = "Radio Treasure Island.html";

const imageNames = {
  "d35d5965-399b-4b9a-bbf9-d61440a39d70": "hero-ship.webp",
  "70ad7a0e-74b7-44b4-baff-4a6f0b8fd0a4": "title-art.webp",
  "f6b06232-f57f-4923-9ada-7401f54566b1": "tagline.webp",
  "daa974e9-3bf4-40a6-856b-fb02a3510091": "keith-david.png",
  "b6c5a703-aae2-4f07-9e90-25eea18ee10c": "john-goodman.png",
  "f95f68bb-79cd-4694-a0e8-abdad345870a": "glynn-turman.png",
};

const extensionFor = {
  "font/woff2": "woff2",
};

function readBundleScript(html, type) {
  const start = `<script type="__bundler/${type}">`;
  const body = html.split(start)[1]?.split("</script>")[0]?.trim();

  if (!body) {
    throw new Error(`Unable to find ${type} script in ${sourceFile}`);
  }

  return body;
}

function decodeAsset(entry) {
  const bytes = Buffer.from(entry.data, "base64");
  return entry.compressed ? gunzipSync(bytes) : bytes;
}

function writeAsset(file, bytes) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
}

function extractStyles(template, manifest) {
  const styles = [...template.matchAll(/<style>([\s\S]*?)<\/style>/g)]
    .map((match) => match[1])
    .join("\n\n");

  let css = styles;
  for (const [uuid, entry] of Object.entries(manifest)) {
    if (entry.mime === "font/woff2") {
      css = css.replaceAll(`url("${uuid}")`, `url("../fonts/${uuid}.woff2")`);
    }
  }

  return [
    '@import "tailwindcss";',
    "",
    '/* Tailwind scans the Jekyll layout and page files for utility classes. */',
    '@source "../../_layouts";',
    '@source "../../index.html";',
    "",
    css.trim(),
    "",
  ].join("\n");
}

const html = readFileSync(sourceFile, "utf8");
const manifest = JSON.parse(readBundleScript(html, "manifest"));
const template = JSON.parse(readBundleScript(html, "template"));

const written = [];

for (const [uuid, entry] of Object.entries(manifest)) {
  if (entry.mime.startsWith("image/") && imageNames[uuid]) {
    const file = join("assets", "images", imageNames[uuid]);
    writeAsset(file, decodeAsset(entry));
    written.push(file);
  }

  if (entry.mime === "font/woff2") {
    const ext = extensionFor[entry.mime];
    const file = join("assets", "fonts", `${uuid}.${ext}`);
    writeAsset(file, decodeAsset(entry));
    written.push(file);
  }
}

const cssFile = join("assets", "css", "input.css");
writeAsset(cssFile, extractStyles(template, manifest));
written.push(cssFile);

console.log(`Extracted ${written.length} production files:`);
for (const file of written.sort()) {
  console.log(`- ${file}`);
}
