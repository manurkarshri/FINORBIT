from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "icons"


def build_icon(size: int, maskable: bool = False) -> Image.Image:
    scale = size / 512
    image = Image.new("RGBA", (size, size), "#f4f7fb")
    background = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(background)

    margin = int((76 if maskable else 38) * scale)
    draw.rounded_rectangle(
        (margin, margin, size - margin, size - margin),
        radius=int(96 * scale),
        fill="#ffffff",
    )

    shadow = background.filter(ImageFilter.GaussianBlur(max(1, int(16 * scale))))
    tinted = Image.new("RGBA", image.size, (33, 54, 111, 45))
    tinted.putalpha(shadow.getchannel("A"))
    image.alpha_composite(tinted, (0, int(12 * scale)))
    image.alpha_composite(background)

    draw = ImageDraw.Draw(image)
    center = size // 2
    orbit_radius = int((142 if not maskable else 118) * scale)
    ring_width = max(3, int(28 * scale))
    draw.ellipse(
        (center - orbit_radius, center - orbit_radius, center + orbit_radius, center + orbit_radius),
        outline="#3157d5",
        width=ring_width,
    )

    ellipse_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ellipse_draw = ImageDraw.Draw(ellipse_layer)
    wide = int((208 if not maskable else 168) * scale)
    high = int((82 if not maskable else 66) * scale)
    ellipse_draw.ellipse((center - wide, center - high, center + wide, center + high), outline="#7447e8", width=max(3, int(22 * scale)))
    ellipse_layer = ellipse_layer.rotate(20, resample=Image.Resampling.BICUBIC, center=(center, center))
    image.alpha_composite(ellipse_layer)

    draw = ImageDraw.Draw(image)
    core = int(47 * scale)
    draw.ellipse((center - core, center - core, center + core, center + core), fill="#3157d5")
    satellite_x, satellite_y = int(420 * scale), int(168 * scale)
    satellite = int(32 * scale)
    draw.ellipse((satellite_x - satellite - ring_width // 2, satellite_y - satellite - ring_width // 2, satellite_x + satellite + ring_width // 2, satellite_y + satellite + ring_width // 2), fill="#ffffff")
    draw.ellipse((satellite_x - satellite, satellite_y - satellite, satellite_x + satellite, satellite_y + satellite), fill="#147b5a")
    return image.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        build_icon(size).save(OUT / f"icon-{size}.png", optimize=True)
    build_icon(512, maskable=True).save(OUT / "icon-maskable-512.png", optimize=True)
    build_icon(180).save(OUT / "apple-touch-icon.png", optimize=True)


if __name__ == "__main__":
    main()
