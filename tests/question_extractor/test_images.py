import unittest

import pdfplumber

from tools.question_extractor.config import PDF_PATH
from tools.question_extractor.images import discover_embedded_images


class ImageTests(unittest.TestCase):
    def test_source_contains_four_diagrams_on_known_pages(self) -> None:
        with pdfplumber.open(PDF_PATH) as pdf:
            images = discover_embedded_images(pdf)
        self.assertEqual(
            [image.page for image in images],
            [94, 98, 103, 103],
        )


if __name__ == "__main__":
    unittest.main()
