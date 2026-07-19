"""Build optimized runtime art from the generated source masters."""
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source-v2"


def save_webp(image, path, quality=86):
    image.save(path, "WEBP", quality=quality, method=6)


def main():
    title = Image.open(SOURCE / "title-couple.png").convert("RGB")
    save_webp(ImageOps.fit(title, (1600, 900), method=Image.Resampling.LANCZOS), ROOT / "ui" / "title-couple-1600.webp", 88)
    save_webp(ImageOps.fit(title, (960, 540), method=Image.Resampling.LANCZOS), ROOT / "ui" / "title-couple-960.webp", 80)

    width, height = title.size
    boy = title.crop((int(width * .21), int(height * .13), int(width * .43), int(height * .86)))
    girl = title.crop((int(width * .405), int(height * .13), int(width * .625), int(height * .87)))
    save_webp(ImageOps.fit(boy, (480, 480), method=Image.Resampling.LANCZOS, centering=(.50, .34)), ROOT / "ui" / "portrait-boy.webp", 86)
    save_webp(ImageOps.fit(girl, (480, 480), method=Image.Resampling.LANCZOS, centering=(.50, .34)), ROOT / "ui" / "portrait-girl.webp", 86)

    atlas = Image.open(SOURCE / "chapter-atlas.png").convert("RGB")
    cell_width, cell_height = atlas.width // 3, atlas.height // 2
    chapter = 0
    for row in range(2):
        for col in range(3):
            chapter += 1
            cell = atlas.crop((col * cell_width + 2, row * cell_height + 2,
                               (col + 1) * cell_width - 2, (row + 1) * cell_height - 2))
            card = ImageOps.fit(cell, (640, 360), method=Image.Resampling.LANCZOS, centering=(.5, .48))
            save_webp(card, ROOT / "chapters" / f"chapter-{chapter}.webp", 84)

    effects = Image.open(SOURCE / "skill-atlas.png").convert("RGB")
    cell_width, cell_height = effects.width // 3, effects.height // 2
    skill = 0
    for row in range(2):
        for col in range(3):
            skill += 1
            cell = effects.crop((col * cell_width, row * cell_height,
                                 (col + 1) * cell_width, (row + 1) * cell_height))
            save_webp(ImageOps.fit(cell, (384, 384), method=Image.Resampling.LANCZOS),
                      ROOT / "effects" / f"hat-skill-{skill}.webp", 84)

    bosses = Image.open(SOURCE / "boss-atlas.png").convert("RGB")
    cell_width, cell_height = bosses.width // 3, bosses.height // 2
    boss = 0
    for row in range(2):
        for col in range(3):
            boss += 1
            cell = bosses.crop((col * cell_width, row * cell_height,
                                (col + 1) * cell_width, (row + 1) * cell_height))
            save_webp(ImageOps.fit(cell, (512, 512), method=Image.Resampling.LANCZOS),
                      ROOT / "bosses" / f"boss-{boss}.webp", 86)

    lantern = Image.open(ROOT / "sprites" / "lantern-premium-alpha.png").convert("RGBA")
    bbox = lantern.getchannel("A").getbbox()
    lantern = lantern.crop((max(0, bbox[0] - 20), max(0, bbox[1] - 20),
                            min(lantern.width, bbox[2] + 20), min(lantern.height, bbox[3] + 20)))
    canvas = Image.new("RGBA", (256, 320), (0, 0, 0, 0))
    contained = ImageOps.contain(lantern, (236, 300), method=Image.Resampling.LANCZOS)
    canvas.alpha_composite(contained, ((256 - contained.width) // 2, (320 - contained.height) // 2))
    save_webp(canvas, ROOT / "sprites" / "lantern-premium.webp", 90)


if __name__ == "__main__":
    main()
