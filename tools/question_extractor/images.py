from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DiagramSource:
    page: int
    index: int
    bbox: tuple[float, float, float, float]


@dataclass(frozen=True)
class DiagramAsset:
    page: int
    index: int
    question_numbers: tuple[int, ...]
    path: Path
    public_src: str
    alt: str


DIAGRAM_CONFIG = {
    (94, 1): (
        "algoritmi-si-structuri-de-date-fig-1.png",
        (4, 5, 6),
        "Fig. 1, arborele binar folosit în întrebările 4-6",
    ),
    (98, 1): (
        "algoritmi-si-structuri-de-date-fig-2.png",
        (26, 27, 28),
        "Fig. 2, lista înlănțuită folosită în întrebările 26-28",
    ),
    (103, 1): (
        "algoritmi-si-structuri-de-date-fig-3.png",
        (47,),
        "Fig. 3, arborele folosit în întrebarea 47",
    ),
    (103, 2): (
        "algoritmi-si-structuri-de-date-fig-4.png",
        (48, 49, 50),
        "Fig. 4, arborele de expresie folosit în întrebările 48-50",
    ),
}


def discover_embedded_images(pdf) -> tuple[DiagramSource, ...]:
    discovered: list[DiagramSource] = []
    for page_number, page in enumerate(pdf.pages, start=1):
        for index, image in enumerate(
            sorted(page.images, key=lambda item: (item["top"], item["x0"])),
            start=1,
        ):
            discovered.append(
                DiagramSource(
                    page=page_number,
                    index=index,
                    bbox=(
                        float(image["x0"]),
                        float(image["top"]),
                        float(image["x1"]),
                        float(image["bottom"]),
                    ),
                )
            )
    return tuple(discovered)


def extract_diagrams(pdf, output_dir: Path) -> tuple[DiagramAsset, ...]:
    output_dir.mkdir(parents=True, exist_ok=True)
    assets: list[DiagramAsset] = []
    for source in discover_embedded_images(pdf):
        config = DIAGRAM_CONFIG.get((source.page, source.index))
        if config is None:
            continue
        filename, question_numbers, alt = config
        path = output_dir / filename
        page = pdf.pages[source.page - 1]
        page.crop(source.bbox).to_image(
            resolution=220,
            antialias=True,
        ).save(path, format="PNG")
        assets.append(
            DiagramAsset(
                page=source.page,
                index=source.index,
                question_numbers=question_numbers,
                path=path,
                public_src=f"/question-assets/{filename}",
                alt=alt,
            )
        )
    return tuple(assets)
