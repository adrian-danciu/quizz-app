import unittest

from tools.question_extractor.content_blocks import (
    infer_language,
    lines_to_blocks,
)
from tools.question_extractor.pdf_layout import LayoutLine, LayoutWord


def line(text: str, x0: float, font: str) -> LayoutLine:
    return LayoutLine(
        top=0,
        words=(
            LayoutWord(
                text=text,
                x0=x0,
                x1=x0 + len(text) * 6,
                top=0,
                bottom=10,
                font=font,
                color=(0,),
            ),
        ),
    )


class ContentBlockTests(unittest.TestCase):
    def test_language_is_inferred_from_module(self) -> None:
        self.assertEqual(infer_language("programare-in-python"), "python")
        self.assertEqual(
            infer_language("programare-orientata-pe-obiecte-cpp"),
            "cpp",
        )
        self.assertEqual(
            infer_language("metode-avansate-de-programare-java"),
            "java",
        )
        self.assertEqual(infer_language("baze-de-date"), "sql")
        self.assertEqual(infer_language("criptografie"), "text")

    def test_monospace_lines_become_an_indented_code_block(self) -> None:
        blocks = lines_to_blocks(
            (
                line("while(a>=b)", 90, "CourierNewPSMT"),
                line("{", 90, "CourierNewPSMT"),
                line("a=a-b;", 108, "CourierNewPSMT"),
                line("}", 90, "CourierNewPSMT"),
            ),
            "fundamentele-programarii",
        )

        self.assertEqual(len(blocks), 1)
        self.assertEqual(blocks[0].type, "code")
        self.assertEqual(blocks[0].language, "c")
        self.assertEqual(
            blocks[0].value,
            "while(a>=b)\n{\n    a=a-b;\n}",
        )

    def test_question_marker_is_removed_from_first_text_line(self) -> None:
        blocks = lines_to_blocks(
            (line("11 Se dă tabelul:", 70, "TimesNewRomanPSMT"),),
            "baze-de-date",
        )
        self.assertEqual(blocks[0].value, "Se dă tabelul:")

    def test_spaced_question_punctuation_is_removed(self) -> None:
        blocks = lines_to_blocks(
            (line("3 . In mod implicit", 70, "TimesNewRomanPSMT"),),
            "cloud-computing",
        )
        self.assertEqual(blocks[0].value, "In mod implicit")

    def test_question_punctuation_attached_to_text_is_removed(self) -> None:
        blocks = lines_to_blocks(
            (line("11 .Serviciul de CloudFormation", 70, "TimesNewRomanPSMT"),),
            "cloud-computing",
        )
        self.assertEqual(blocks[0].value, "Serviciul de CloudFormation")


if __name__ == "__main__":
    unittest.main()
