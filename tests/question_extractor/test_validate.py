import unittest

from tools.question_extractor.validate import validate_question


class ValidationTests(unittest.TestCase):
    def test_question_requires_unique_options_and_expected_count(self) -> None:
        question = {
            "id": "sample-001",
            "moduleId": "sample",
            "source": {"page": 1, "questionNumber": 1},
            "content": [{"type": "text", "value": "Prompt"}],
            "options": [
                {
                    "id": "a",
                    "content": [{"type": "text", "value": "A"}],
                },
                {
                    "id": "a",
                    "content": [{"type": "text", "value": "Duplicate"}],
                },
            ],
            "correctOptionId": "a",
            "explanation": None,
        }
        codes = {
            issue.code
            for issue in validate_question(question, expected_option_count=4)
        }
        self.assertIn("option-count", codes)
        self.assertIn("duplicate-option-id", codes)

    def test_cloud_source_exception_allows_three_options(self) -> None:
        question = {
            "id": "cloud-computing-005",
            "moduleId": "cloud-computing",
            "source": {"page": 173, "questionNumber": 5},
            "content": [{"type": "text", "value": "Prompt"}],
            "options": [
                {"id": key, "content": [{"type": "text", "value": key}]}
                for key in ("a", "b", "d")
            ],
            "correctOptionId": "b",
            "explanation": None,
        }
        issues = validate_question(question, expected_option_count=3)
        self.assertEqual(issues, [])


if __name__ == "__main__":
    unittest.main()
