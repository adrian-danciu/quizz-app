from dataclasses import dataclass
from pathlib import Path


PDF_PATH = Path("/Users/adrian/Downloads/Grile Licenta 2026.pdf")
EXPECTED_TOTAL = 714


@dataclass(frozen=True)
class ModuleConfig:
    id: str
    name: str
    page_start: int
    page_end: int
    question_count: int
    order: int


MODULES = (
    ModuleConfig(
        "fundamentele-programarii",
        "Fundamentele programării",
        3,
        22,
        50,
        1,
    ),
    ModuleConfig(
        "programare-in-python",
        "Programare în Python",
        23,
        37,
        50,
        2,
    ),
    ModuleConfig(
        "programare-orientata-pe-obiecte-cpp",
        "Programare orientată pe obiecte (C++)",
        38,
        58,
        50,
        3,
    ),
    ModuleConfig(
        "metode-avansate-de-programare-java",
        "Metode avansate de programare (Java)",
        59,
        79,
        54,
        4,
    ),
    ModuleConfig(
        "tehnici-avansate-de-programare",
        "Tehnici avansate de programare",
        80,
        92,
        50,
        5,
    ),
    ModuleConfig(
        "algoritmi-si-structuri-de-date",
        "Algoritmi și structuri de date",
        93,
        103,
        50,
        6,
    ),
    ModuleConfig("baze-de-date", "Baze de date", 105, 115, 50, 7),
    ModuleConfig(
        "sisteme-de-gestiune-a-bazelor-de-date",
        "Sisteme de gestiune a bazelor de date",
        116,
        125,
        50,
        8,
    ),
    ModuleConfig(
        "sisteme-de-operare",
        "Sisteme de operare",
        127,
        140,
        50,
        9,
    ),
    ModuleConfig(
        "retele-de-calculatoare-administrarea-retelelor",
        "Rețele de calculatoare / Administrarea rețelelor de calculatoare",
        141,
        148,
        58,
        10,
    ),
    ModuleConfig("criptografie", "Criptografie", 149, 156, 50, 11),
    ModuleConfig(
        "tehnologii-web",
        "Tehnologii web",
        158,
        165,
        54,
        12,
    ),
    ModuleConfig(
        "comert-electronic",
        "Comerț electronic",
        166,
        172,
        48,
        13,
    ),
    ModuleConfig("cloud-computing", "Cloud computing", 173, 174, 20, 14),
    ModuleConfig(
        "inovare-si-transformare-digitala",
        "Inovare și transformare digitală",
        175,
        180,
        30,
        15,
    ),
)
