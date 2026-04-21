from PIL import Image, ImageOps
from pathlib import Path

base = Path(__file__).resolve().parent
inp = base / "image.png"

img = Image.open(inp).convert("RGBA")
ImageOps.fit(img, (192, 192), method=Image.Resampling.LANCZOS).save(base / "icon-192.png", format="PNG")
ImageOps.fit(img, (512, 512), method=Image.Resampling.LANCZOS).save(base / "icon-512.png", format="PNG")