#!/usr/bin/env python3
"""Generate Zarbin app icons (PNG) from a vector design."""
import os
import cairosvg
from PIL import Image

OUT_BASE = "/home/z/my-project/zarbin/android/app/src/main/res"
TMP = "/tmp/zarbin-icons"
os.makedirs(TMP, exist_ok=True)

# Icon sizes for each density (Android launcher icon)
SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

# Foreground (adaptive icon foreground) sizes - 108dp with 72dp safe zone
FG_SIZES = {
    "mipmap-mdpi":    108,
    "mipmap-hdpi":    162,
    "mipmap-xhdpi":   216,
    "mipmap-xxhdpi":  324,
    "mipmap-xxxhdpi": 432,
}

# Splash screen size (xxhdpi baseline)
SPLASH_SIZES = {
    "drawable-mdpi":    480,
    "drawable-hdpi":    720,
    "drawable-xhdpi":   960,
    "drawable-xxhdpi":  1440,
    "drawable-xxxhdpi": 1920,
}

# Main launcher icon SVG (full square with rounded corners)
LAUNCHER_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c322c"/>
      <stop offset="100%" stop-color="#0f3d37"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <radialGradient id="shine" cx="0.3" cy="0.3" r="0.6">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#fef3c7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <circle cx="512" cy="512" r="380" fill="none" stroke="#14b8a6" stroke-width="4" opacity="0.3"/>
  <circle cx="512" cy="512" r="320" fill="url(#gold)"/>
  <circle cx="512" cy="512" r="320" fill="url(#shine)"/>
  <circle cx="512" cy="512" r="320" fill="none" stroke="#92400e" stroke-width="6" opacity="0.4"/>
  <text x="512" y="680" font-family="Vazirmatn, Tahoma, sans-serif" font-size="460" font-weight="900" 
        text-anchor="middle" fill="#0c322c">ز</text>
  <text x="800" y="290" font-family="Arial, sans-serif" font-size="130" font-weight="900" 
        text-anchor="middle" fill="#14b8a6" opacity="0.7">Z</text>
</svg>
"""

# Adaptive icon foreground SVG (just the coin, no background)
FOREGROUND_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <radialGradient id="shine" cx="0.3" cy="0.3" r="0.6">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#fef3c7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="512" cy="512" r="340" fill="url(#gold)"/>
  <circle cx="512" cy="512" r="340" fill="url(#shine)"/>
  <circle cx="512" cy="512" r="340" fill="none" stroke="#92400e" stroke-width="8" opacity="0.5"/>
  <text x="512" y="700" font-family="Vazirmatn, Tahoma, sans-serif" font-size="500" font-weight="900" 
        text-anchor="middle" fill="#0c322c">ز</text>
</svg>
"""

# Splash screen SVG (centered logo on dark teal background)
SPLASH_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c322c"/>
      <stop offset="100%" stop-color="#0f3d37"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <circle cx="540" cy="860" r="280" fill="url(#gold)"/>
  <circle cx="540" cy="860" r="280" fill="none" stroke="#92400e" stroke-width="6" opacity="0.4"/>
  <text x="540" y="1000" font-family="Vazirmatn, Tahoma, sans-serif" font-size="400" font-weight="900" 
        text-anchor="middle" fill="#0c322c">ز</text>
  <text x="540" y="1280" font-family="Vazirmatn, Tahoma, sans-serif" font-size="80" font-weight="700" 
        text-anchor="middle" fill="#5eead4">زرین</text>
  <text x="540" y="1360" font-family="Arial, sans-serif" font-size="36" font-weight="600" 
        text-anchor="middle" fill="#94a3b8">Zarbin · v1.0.0</text>
  <text x="540" y="1830" font-family="Arial, sans-serif" font-size="28" 
        text-anchor="middle" fill="#475569">SonaMother © 2026</text>
</svg>
"""


def svg_to_png(svg: str, out_path: str, size: int):
    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=out_path,
                     output_width=size, output_height=size)
    print(f"  wrote {out_path}")


def svg_to_png_sized(svg: str, out_path: str, w: int, h: int):
    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=out_path,
                     output_width=w, output_height=h)
    print(f"  wrote {out_path}")


# 1. Launcher icons (square + round)
print("=== Generating launcher icons ===")
for density, size in SIZES.items():
    folder = os.path.join(OUT_BASE, density)
    os.makedirs(folder, exist_ok=True)
    svg_to_png(LAUNCHER_SVG, os.path.join(folder, "ic_launcher.png"), size)
    # Round version (we'll use the same square - it'll be clipped by Android)
    svg_to_png(LAUNCHER_SVG, os.path.join(folder, "ic_launcher_round.png"), size)

# 2. Foreground icons for adaptive icon
print("\n=== Generating adaptive icon foregrounds ===")
for density, size in FG_SIZES.items():
    folder = os.path.join(OUT_BASE, density)
    svg_to_png(FOREGROUND_SVG, os.path.join(folder, "ic_launcher_foreground.png"), size)

# 3. Splash screen
print("\n=== Generating splash screen ===")
for density, w in SPLASH_SIZES.items():
    folder = os.path.join(OUT_BASE, density)
    os.makedirs(folder, exist_ok=True)
    h = int(w * 1920 / 1080)
    svg_to_png_sized(SPLASH_SVG, os.path.join(folder, "splash.png"), w, h)

# 4. Also write a 1024x1024 master icon to drawable for store listing
print("\n=== Generating store listing icon ===")
svg_to_png(LAUNCHER_SVG, os.path.join(OUT_BASE, "drawable", "ic_launcher.png"), 512)

# 5. Generate a notification icon (white silhouette on transparent)
NOTIF_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <text x="512" y="700" font-family="Vazirmatn, Tahoma, sans-serif" font-size="600" font-weight="900" 
        text-anchor="middle" fill="black">ز</text>
</svg>
"""
print("\n=== Generating notification icon ===")
svg_to_png(NOTIF_SVG, os.path.join(OUT_BASE, "drawable-mdpi", "ic_stat_zarbin.png"), 24)
svg_to_png(NOTIF_SVG, os.path.join(OUT_BASE, "drawable-hdpi", "ic_stat_zarbin.png"), 36)
svg_to_png(NOTIF_SVG, os.path.join(OUT_BASE, "drawable-xhdpi", "ic_stat_zarbin.png"), 48)
svg_to_png(NOTIF_SVG, os.path.join(OUT_BASE, "drawable-xxhdpi", "ic_stat_zarbin.png"), 72)
svg_to_png(NOTIF_SVG, os.path.join(OUT_BASE, "drawable-xxxhdpi", "ic_stat_zarbin.png"), 96)

# Also generate a logo PNG for use in web app / GitHub
print("\n=== Generating web logo ===")
svg_to_png(LAUNCHER_SVG, "/home/z/my-project/zarbin/www/assets/icons/icon-512.png", 512)
svg_to_png(LAUNCHER_SVG, "/home/z/my-project/zarbin/www/assets/icons/icon-192.png", 192)
svg_to_png(LAUNCHER_SVG, "/home/z/my-project/zarbin/www/assets/icons/icon-96.png", 96)

print("\n✓ All icons generated.")
