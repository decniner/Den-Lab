#!/usr/bin/env python3
"""Build a labeled sheet from finished raster cover and scene illustrations."""
from pathlib import Path
import argparse


def create_contact_sheet(inputs, output: Path):
    paths = [Path(p) for p in inputs]
    missing = [str(p) for p in paths if not p.is_file()]
    if missing:
        raise RuntimeError("Artwork files missing: " + ", ".join(missing))
    if not paths:
        raise RuntimeError("Provide at least one finished cover or scene illustration")
    try:
        from PIL import Image, ImageDraw
    except ImportError as exc:
        raise RuntimeError("Contact-sheet generation requires Pillow. Install it with: python -m pip install Pillow") from exc
    columns = min(3, len(paths))
    cell_w, cell_h, label_h = 360, 640, 40
    rows = (len(paths) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_w, rows * (cell_h + label_h)), (242, 234, 215))
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(paths):
        with Image.open(path) as opened:
            image = opened.convert("RGB")
        resampling = getattr(Image, "Resampling", Image)
        image.thumbnail((cell_w - 16, cell_h - 16), resampling.LANCZOS)
        col, row = index % columns, index // columns
        x = col * cell_w + (cell_w - image.width) // 2
        y = row * (cell_h + label_h) + (cell_h - image.height) // 2
        sheet.paste(image, (x, y))
        draw.text((col * cell_w + 8, row * (cell_h + label_h) + cell_h + 8), path.name[:48], fill=(25, 22, 23))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True)
    return output


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("artwork", nargs="+", type=Path)
    args = parser.parse_args(argv)
    try:
        result = create_contact_sheet(args.artwork, args.output)
    except RuntimeError as exc:
        parser.exit(2, f"Contact sheet failed: {exc}\n")
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
