import json
import tempfile
import unittest
from pathlib import Path

from tools.question_extractor.cli import build_dataset
from tools.question_extractor.config import PDF_PATH
from tools.question_extractor.validate import validate_dataset


class ExtractionIntegrationTests(unittest.TestCase):
    def test_complete_dataset_builds_and_validates(self) -> None:
        corrections = json.loads(
            Path("tools/question_extractor/corrections.json").read_text()
        )
        with tempfile.TemporaryDirectory() as temporary:
            public_root = Path(temporary)
            result = build_dataset(
                PDF_PATH,
                corrections,
                public_root / "question-assets",
            )
            self.assertEqual(len(result.dataset.questions), 714)
            self.assertEqual(
                validate_dataset(result.dataset, public_root),
                [],
            )


if __name__ == "__main__":
    unittest.main()
