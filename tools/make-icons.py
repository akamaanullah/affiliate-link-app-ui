#!/usr/bin/env python3
"""Draw the Northline mark as PNG icons. No third-party libraries."""
import struct
import zlib
from pathlib import Path

INK = (23, 23, 20, 255)
CREAM = (243, 242, 238, 255)


def in_round_rect(x, y, size, radius):
    if radius <= 0:
        return True
    cx = min(max(x, radius), size - 1 - radius)
    cy = min(max(y, radius), size - 1 - radius)
    # inside the inner box
    if radius <= x < size - radius or radius <= y < size - radius:
        if 0 <= x < size and 0 <= y < size:
            # corners still need the circle test when both are in the corner zone
            if (x < radius or x >= size - radius) and (y < radius or y >= size - radius):
                pass
            else:
                return True
    if x < radius:
        cx = radius
    elif x >= size - radius:
        cx = size - 1 - radius
    else:
        cx = x
    if y < radius:
        cy = radius
    elif y >= size - radius:
        cy = size - 1 - radius
    else:
        cy = y
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2


def in_n(nx, ny):
    if 0.30 <= nx <= 0.43 and 0.22 <= ny <= 0.78:
        return True
    if 0.57 <= nx <= 0.70 and 0.22 <= ny <= 0.78:
        return True
    span = 0.78 - 0.22
    t = (ny - 0.22) / span
    if 0 <= t <= 1:
        cx = 0.365 + t * (0.635 - 0.365)
        if abs(nx - cx) <= 0.075:
            return True
    return False


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path, size, radius, pad):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            if not in_round_rect(x, y, size, radius):
                raw.extend((0, 0, 0, 0))
                continue
            nx = (x - pad) / (size - 2 * pad)
            ny = (y - pad) / (size - 2 * pad)
            raw.extend(CREAM if 0 <= nx <= 1 and 0 <= ny <= 1 and in_n(nx, ny) else INK)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    Path(path).write_bytes(png)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1] / "icons"
    root.mkdir(exist_ok=True)
    write_png(root / "icon-192.png", 192, 36, 28)
    write_png(root / "icon-512.png", 512, 96, 74)
    write_png(root / "apple-touch-icon.png", 180, 32, 28)
    write_png(root / "icon-maskable-512.png", 512, 0, 130)
