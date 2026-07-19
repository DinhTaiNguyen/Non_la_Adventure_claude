"""Build optimized runtime art from the generated source masters."""
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source-v2"
SOURCE_V3 = ROOT / "source-v3"
SOURCE_V4 = ROOT / "source-v4"


def save_webp(image, path, quality=86):
    image.save(path, "WEBP", quality=quality, method=6)


def atlas_cell(image, cols, rows, index, inset=0):
    """Crop a cell using rounded boundaries so non-divisible atlases stay aligned."""
    row, col = divmod(index, cols)
    left = round(col * image.width / cols) + inset
    right = round((col + 1) * image.width / cols) - inset
    top = round(row * image.height / rows) + inset
    bottom = round((row + 1) * image.height / rows) - inset
    return image.crop((left, top, right, bottom))


def contained_alpha(image, size, padding=10):
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        image = image.crop(bbox)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    fit = ImageOps.contain(image, (size[0] - padding * 2, size[1] - padding * 2),
                           method=Image.Resampling.LANCZOS)
    canvas.alpha_composite(fit, ((size[0] - fit.width) // 2, (size[1] - fit.height) // 2))
    return canvas


def main():
    for folder in ("ui", "chapters", "effects", "bosses", "sprites", "items",
                   "lanterns", "abilities", "enemy-skills", "scenery", "ui-kit",
                   "props", "coop-effects"):
        (ROOT / folder).mkdir(parents=True, exist_ok=True)

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

    # V3 production library. Black-background VFX stay black so the canvas can
    # use screen blending; this preserves soft glow without shipping large PNGs.
    character_sheet = Image.open(SOURCE_V3 / "character-sheet.png").convert("RGB")
    save_webp(ImageOps.contain(character_sheet, (1200, 800), method=Image.Resampling.LANCZOS),
              ROOT / "ui" / "character-sheet-v3.webp", 86)

    # The large anchor figures from the production sheet now appear in the
    # character picker and its portrait crops appear in the live HUD.
    boy_card = character_sheet.crop((10, 120, 420, 1020))
    girl_card = character_sheet.crop((1100, 120, 1528, 1020))
    save_webp(ImageOps.fit(boy_card, (360, 520), method=Image.Resampling.LANCZOS,
                           centering=(.48, .5)), ROOT / "ui" / "character-boy-sheet.webp", 86)
    save_webp(ImageOps.fit(girl_card, (360, 520), method=Image.Resampling.LANCZOS,
                           centering=(.54, .5)), ROOT / "ui" / "character-girl-sheet.webp", 86)
    boy_face = character_sheet.crop((45, 135, 355, 480))
    girl_face = character_sheet.crop((1180, 140, 1510, 505))
    save_webp(ImageOps.fit(boy_face, (320, 320), method=Image.Resampling.LANCZOS,
                           centering=(.5, .42)), ROOT / "ui" / "portrait-boy-sheet.webp", 87)
    save_webp(ImageOps.fit(girl_face, (320, 320), method=Image.Resampling.LANCZOS,
                           centering=(.5, .42)), ROOT / "ui" / "portrait-girl-sheet.webp", 87)

    item_names = ("lantern", "petal", "leaf", "envelope", "banhchung", "star", "hat", "candle")
    items = Image.open(SOURCE_V3 / "item-atlas.png").convert("RGB")
    cell_width, cell_height = items.width // 4, items.height // 2
    for index, name in enumerate(item_names):
        row, col = divmod(index, 4)
        cell = items.crop((col * cell_width, row * cell_height,
                           (col + 1) * cell_width, (row + 1) * cell_height))
        save_webp(ImageOps.fit(cell, (192, 192), method=Image.Resampling.LANCZOS),
                  ROOT / "items" / f"{name}.webp", 84)

    lantern_names = ("hoian", "moon", "bamboo", "lotus", "bronze", "twin", "heart", "memory")
    lanterns = Image.open(SOURCE_V3 / "lantern-atlas.png").convert("RGB")
    cell_width, cell_height = lanterns.width // 4, lanterns.height // 2
    for index, name in enumerate(lantern_names):
        row, col = divmod(index, 4)
        cell = lanterns.crop((col * cell_width, row * cell_height,
                              (col + 1) * cell_width, (row + 1) * cell_height))
        save_webp(ImageOps.fit(cell, (256, 320), method=Image.Resampling.LANCZOS),
                  ROOT / "lanterns" / f"{name}.webp", 85)

    ability_names = ("wind", "shield", "light", "lotus", "love-jump", "resonance")
    abilities = Image.open(SOURCE_V3 / "ability-atlas.png").convert("RGB")
    cell_width, cell_height = abilities.width // 3, abilities.height // 2
    for index, name in enumerate(ability_names):
        row, col = divmod(index, 3)
        cell = abilities.crop((col * cell_width, row * cell_height,
                               (col + 1) * cell_width, (row + 1) * cell_height))
        save_webp(ImageOps.fit(cell, (384, 384), method=Image.Resampling.LANCZOS),
                  ROOT / "abilities" / f"{name}.webp", 84)

    enemy_skills = Image.open(SOURCE_V3 / "enemy-skill-atlas.png").convert("RGB")
    cell_width, cell_height = enemy_skills.width // 3, enemy_skills.height // 2
    for index in range(6):
        row, col = divmod(index, 3)
        cell = enemy_skills.crop((col * cell_width, row * cell_height,
                                  (col + 1) * cell_width, (row + 1) * cell_height))
        save_webp(ImageOps.fit(cell, (384, 384), method=Image.Resampling.LANCZOS),
                  ROOT / "enemy-skills" / f"chapter-{index + 1}.webp", 84)

    scenery = Image.open(SOURCE_V3 / "scenery-atlas.png").convert("RGB")
    cell_width, cell_height = scenery.width // 3, scenery.height // 2
    for index in range(6):
        row, col = divmod(index, 3)
        cell = scenery.crop((col * cell_width + 2, row * cell_height + 2,
                             (col + 1) * cell_width - 2, (row + 1) * cell_height - 2))
        scene = ImageOps.fit(cell, (960, 540), method=Image.Resampling.LANCZOS, centering=(.5, .48))
        save_webp(scene, ROOT / "scenery" / f"chapter-{index + 1}.webp", 84)

    # V4 interface and cooperative mechanic library.
    ui_names = ("love", "rescue", "checkpoint", "quest", "satchel", "health",
                "shield", "mastery", "wind", "light", "map", "boss")
    ui_kit = Image.open(SOURCE_V4 / "ui-kit-atlas.png").convert("RGB")
    for index, name in enumerate(ui_names):
        cell = atlas_cell(ui_kit, 4, 3, index, 2)
        save_webp(ImageOps.fit(cell, (256, 256), method=Image.Resampling.LANCZOS),
                  ROOT / "ui-kit" / f"{name}.webp", 85)

    coop_names = ("revive-aura", "rescue-hands", "love-burst", "twin-wave",
                  "checkpoint-spiral", "couple-ward")
    coop = Image.open(SOURCE_V4 / "coop-vfx-atlas.png").convert("RGB")
    for index, name in enumerate(coop_names):
        cell = atlas_cell(coop, 3, 2, index, 2)
        save_webp(ImageOps.fit(cell, (384, 384), method=Image.Resampling.LANCZOS),
                  ROOT / "coop-effects" / f"{name}.webp", 85)

    prop_names = ("hoian-house", "river-boat", "village-house", "lotus-pavilion",
                  "temple-gate", "festival-stage", "checkpoint-arch", "craft-stall",
                  "rope-gate", "stone-lantern", "helper-crate", "quest-sign")
    props = Image.open(SOURCE_V4 / "world-prop-atlas-alpha.png").convert("RGBA")
    for index, name in enumerate(prop_names):
        cell = atlas_cell(props, 4, 3, index, 2)
        sprite = contained_alpha(cell, (384, 384), 8)
        save_webp(sprite, ROOT / "props" / f"{name}.webp", 88)


if __name__ == "__main__":
    main()
