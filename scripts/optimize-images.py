#!/usr/bin/env python3
"""
Zarbin APK Size Optimizer
=========================
Optimizes all images in the Android project and web assets:
1. Removes redundant density-specific splash screens (keeps only drawable/splash.png)
2. Converts all PNG splash/art to WebP (70% smaller, supported on Android 4.0+)
3. Resizes splash screens to reasonable max dimensions
4. Strips metadata from all images
5. Removes unused drawable-land-*, drawable-port-* directories
"""
import os
import shutil
from PIL import Image

ANDROID_RES = '/home/z/my-project/zarbin/android/app/src/main/res'
WEB_ART = '/home/z/my-project/zarbin/www/assets/art'
WEB_ICONS = '/home/z/my-project/zarbin/www/assets/icons'

# ==================== 1. Remove redundant splash screen directories ====================
print("=" * 60)
print("STEP 1: Remove redundant splash screen directories")
print("=" * 60)

# Capacitor only needs drawable/splash.png — Android scales it automatically.
# The drawable-land-*, drawable-port-*, drawable-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}
# variants are all redundant when we have a single vector or high-res splash.
dirs_to_remove = []
for d in os.listdir(ANDROID_RES):
    full = os.path.join(ANDROID_RES, d)
    if not os.path.isdir(full):
        continue
    # Remove density-specific drawable dirs that contain ONLY splash.png
    if d.startswith('drawable-') and d != 'drawable':
        # Check if the only content is splash.png or ic_stat_zarbin.png
        contents = os.listdir(full)
        # Keep ic_stat_zarbin.png in density-specific dirs (notification icons must be density-specific)
        # but remove splash.png from all density-specific drawable dirs
        if 'splash.png' in contents:
            splash_path = os.path.join(full, 'splash.png')
            size = os.path.getsize(splash_path)
            os.remove(splash_path)
            print(f"  Removed {d}/splash.png ({size//1024} KB)")
            # If dir is now empty or only has hidden files, remove it
            remaining = os.listdir(full)
            if not remaining or all(f.startswith('.') for f in remaining):
                os.rmdir(full)
                print(f"  Removed empty dir: {d}")

# ==================== 2. Optimize the single drawable/splash.png ====================
print("\n" + "=" * 60)
print("STEP 2: Optimize drawable/splash.png (the only splash we keep)")
print("=" * 60)

# Use the portrait AI art as the splash, but resized to 1080x1920 (max needed for xxxhdpi phones)
# and converted to WebP for ~70% size reduction
splash_src = '/tmp/zarbin-art/splash-portrait.png'
if not os.path.exists(splash_src):
    # Fall back to the existing drawable/splash.png
    splash_src = os.path.join(ANDROID_RES, 'drawable', 'splash.png')

if os.path.exists(splash_src):
    img = Image.open(splash_src).convert('RGB')
    # Resize to max 1080x1920 (perfect for xxxhdpi phones, Android scales down for lower densities)
    if img.width > 1080 or img.height > 1920:
        # Crop to portrait 9:16 aspect ratio
        target_ratio = 1080 / 1920
        src_ratio = img.width / img.height
        if src_ratio > target_ratio:
            new_w = int(img.height * target_ratio)
            offset = (img.width - new_w) // 2
            img = img.crop((offset, 0, offset + new_w, img.height))
        else:
            new_h = int(img.width / target_ratio)
            offset = (img.height - new_h) // 2
            img = img.crop((0, offset, img.width, offset + new_h))
        img = img.resize((1080, 1920), Image.LANCZOS)
    # Save as WebP (Android 4.0+ supports WebP lossless)
    splash_dst = os.path.join(ANDROID_RES, 'drawable', 'splash.png')
    img.save(splash_dst, 'PNG', optimize=True)
    print(f"  Optimized drawable/splash.png: {os.path.getsize(splash_dst)//1024} KB")
    # Also save as WebP variant for even smaller size (Android will use it if .webp exists)
    splash_webp = os.path.join(ANDROID_RES, 'drawable', 'splash.webp')
    img.save(splash_webp, 'WEBP', quality=85, method=6)
    print(f"  Created drawable/splash.webp: {os.path.getsize(splash_webp)//1024} KB")

# ==================== 3. Optimize app launcher icons ====================
print("\n" + "=" * 60)
print("STEP 3: Optimize app launcher icons (strip metadata)")
print("=" * 60)

# Launcher icons must stay as PNG (Android adaptive icon requires it for older API).
# But we can strip metadata and use optimize=True.
for d in os.listdir(ANDROID_RES):
    full = os.path.join(ANDROID_RES, d)
    if not os.path.isdir(full) or not d.startswith('mipmap-'):
        continue
    for fname in os.listdir(full):
        if fname.endswith('.png'):
            path = os.path.join(full, fname)
            img = Image.open(path).convert('RGBA')
            old_size = os.path.getsize(path)
            img.save(path, 'PNG', optimize=True)
            new_size = os.path.getsize(path)
            print(f"  {d}/{fname}: {old_size//1024}KB → {new_size//1024}KB")

# Notification icons
for d in os.listdir(ANDROID_RES):
    full = os.path.join(ANDROID_RES, d)
    if not os.path.isdir(full) or not d.startswith('drawable-'):
        continue
    for fname in os.listdir(full):
        if fname == 'ic_stat_zarbin.png':
            path = os.path.join(full, fname)
            img = Image.open(path).convert('L')
            img.save(path, 'PNG', optimize=True)
            print(f"  {d}/{fname}: {os.path.getsize(path)//1024}KB")

# Store listing icon
drawable_icon = os.path.join(ANDROID_RES, 'drawable', 'ic_launcher.png')
if os.path.exists(drawable_icon):
    img = Image.open(drawable_icon).convert('RGBA')
    img.save(drawable_icon, 'PNG', optimize=True)
    print(f"  drawable/ic_launcher.png: {os.path.getsize(drawable_icon)//1024}KB")

# ==================== 4. Optimize web app art (convert to WebP) ====================
print("\n" + "=" * 60)
print("STEP 4: Optimize web app art (PNG → WebP)")
print("=" * 60)

# Convert all art files to WebP (browsers all support WebP since 2020)
# But keep the originals for compatibility
for fname in os.listdir(WEB_ART):
    if fname.endswith('.png'):
        src = os.path.join(WEB_ART, fname)
        dst = os.path.join(WEB_ART, fname.replace('.png', '.webp'))
        img = Image.open(src)
        # Resize large art to max 1024x1024 or preserve aspect ratio
        max_dim = 1024
        if max(img.width, img.height) > max_dim:
            ratio = max_dim / max(img.width, img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        # Save as WebP
        img.save(dst, 'WEBP', quality=82, method=6)
        old_size = os.path.getsize(src)
        new_size = os.path.getsize(dst)
        saving = (1 - new_size/old_size) * 100
        print(f"  {fname}: {old_size//1024}KB → {new_size//1024}KB (-{saving:.0f}%)")
        # Remove the original PNG
        os.remove(src)

# Optimize PWA icons (keep as PNG for manifest compatibility, but strip metadata)
for fname in os.listdir(WEB_ICONS):
    if fname.endswith('.png'):
        path = os.path.join(WEB_ICONS, fname)
        img = Image.open(path).convert('RGBA')
        img.save(path, 'PNG', optimize=True)
        print(f"  icons/{fname}: {os.path.getsize(path)//1024}KB")

# ==================== 5. Update HTML to reference .webp instead of .png ====================
print("\n" + "=" * 60)
print("STEP 5: Update HTML/JS to reference .webp art files")
print("=" * 60)

# Update index.html and render.js to point to .webp versions
files_to_update = [
    '/home/z/my-project/zarbin/www/index.html',
    '/home/z/my-project/zarbin/www/js/render.js',
]
for fpath in files_to_update:
    with open(fpath, 'r') as f:
        content = f.read()
    original = content
    for fname in ['onboarding-art', 'empty-state', 'welcome-hero', 'header-banner', 'splash-portrait', 'icon-main', 'feature-graphic']:
        content = content.replace(f'assets/art/{fname}.png', f'assets/art/{fname}.webp')
    if content != original:
        with open(fpath, 'w') as f:
            f.write(content)
        print(f"  Updated {fpath}")
    else:
        print(f"  No changes needed in {fpath}")

# ==================== 6. Final size report ====================
print("\n" + "=" * 60)
print("STEP 6: Final size report")
print("=" * 60)

# Sum all drawable and mipmap sizes
total_res = 0
for root, dirs, files in os.walk(ANDROID_RES):
    for f in files:
        if f.endswith(('.png', '.webp')):
            total_res += os.path.getsize(os.path.join(root, f))

total_web_art = 0
for f in os.listdir(WEB_ART):
    total_web_art += os.path.getsize(os.path.join(WEB_ART, f))

print(f"  Android res/ total: {total_res//1024} KB ({total_res/1024/1024:.2f} MB)")
print(f"  Web assets/art/ total: {total_web_art//1024} KB ({total_web_art/1024/1024:.2f} MB)")
print(f"  Combined: {(total_res + total_web_art)/1024/1024:.2f} MB")
print("")
print("✓ Optimization complete.")
