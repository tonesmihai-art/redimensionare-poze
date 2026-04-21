import { ZipWriter } from "./zip-writer.js";

const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generateBtn");
const exportBtn = document.getElementById("exportBtn");
const previewContainer = document.getElementById("preview");

let sourceImage = null;
let generatedIcons = [];

const SIZES = [48, 72, 96, 128, 144, 152, 192, 384, 512];

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function cropAndResize(img, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
  return canvas;
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  sourceImage = await loadImageFromFile(file);
  generateBtn.disabled = false;
  previewContainer.innerHTML = "";
  generatedIcons = [];
});

generateBtn.addEventListener("click", async () => {
  previewContainer.innerHTML = "";
  generatedIcons = [];

  for (const size of SIZES) {
    const canvas = cropAndResize(sourceImage, size);
    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/png")
    );

    generatedIcons.push({ size, blob });

    const url = URL.createObjectURL(blob);
    const card = document.createElement("div");
    card.className = "icon-card";

    const img = document.createElement("img");
    img.src = url;
    img.width = size / 2;
    img.height = size / 2;

    const label = document.createElement("div");
    label.textContent = `${size}x${size}`;

    card.appendChild(img);
    card.appendChild(label);
    previewContainer.appendChild(card);
  }

  exportBtn.disabled = false;
});

function buildManifestJson() {
  const icons = generatedIcons.map(({ size }) => ({
    src: `icon-${size}.png`,
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose: "any"
  }));

  return JSON.stringify({
    name: "My PWA App",
    short_name: "MyApp",
    start_url: ".",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons
  }, null, 2);
}

exportBtn.addEventListener("click", async () => {
  const zip = new ZipWriter();

  for (const { size, blob } of generatedIcons) {
    await zip.addFile(`icon-${size}.png`, blob);
  }

  const manifestBlob = new Blob([buildManifestJson()], { type: "application/json" });
  await zip.addFile("manifest.json", manifestBlob);

  const zipBlob = zip.generate();

  const a = document.createElement("a");
  a.href = URL.createObjectURL(zipBlob);
  a.download = "pwa-icons.zip";
  a.click();
  URL.revokeObjectURL(a.href);
});
