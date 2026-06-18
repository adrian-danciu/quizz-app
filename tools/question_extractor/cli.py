from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import pdfplumber

from tools.question_extractor.answers import (
    AnswerResolution,
    detect_correct_options,
    resolve_correct_option,
)
from tools.question_extractor.config import MODULES, PDF_PATH
from tools.question_extractor.content_blocks import (
    explanation_blocks,
    lines_to_blocks,
)
from tools.question_extractor.images import DiagramAsset, extract_diagrams
from tools.question_extractor.models import (
    ContentBlock,
    Dataset,
    Module,
    Option,
    Question,
    QuestionSource,
)
from tools.question_extractor.report import write_report
from tools.question_extractor.segment import segment_module, split_question
from tools.question_extractor.validate import validate_dataset


ROOT = Path(__file__).resolve().parents[2]
CORRECTIONS_PATH = ROOT / "tools/question_extractor/corrections.json"
DATASET_PATH = ROOT / "src/data/questions.json"
PUBLIC_ROOT = ROOT / "public"
ASSET_DIR = PUBLIC_ROOT / "question-assets"
REPORT_PATH = ROOT / "reports/question-extraction.md"


@dataclass(frozen=True)
class ExtractionResult:
    dataset: Dataset
    warnings: tuple[str, ...]
    answer_resolutions: dict[str, AnswerResolution]
    assets: tuple[DiagramAsset, ...]


def _diagram_block(
    module_id: str,
    question_number: int,
    assets: tuple[DiagramAsset, ...],
) -> ContentBlock | None:
    if module_id != "algoritmi-si-structuri-de-date":
        return None
    asset = next(
        (
            item
            for item in assets
            if question_number in item.question_numbers
        ),
        None,
    )
    if asset is None:
        return None
    return ContentBlock(type="image", src=asset.public_src, alt=asset.alt)


def _corrected_options(correction: dict) -> tuple[Option, ...] | None:
    corrected = correction.get("options")
    if corrected is None:
        return None
    return tuple(
        Option(
            id=option_id,
            content=(
                ContentBlock(type="code", language="text", value=value),
            ),
        )
        for option_id, value in corrected.items()
    )


def build_dataset(
    pdf_path: Path,
    corrections: dict,
    asset_dir: Path,
) -> ExtractionResult:
    questions: list[Question] = []
    warnings: list[str] = []
    resolutions: dict[str, AnswerResolution] = {}

    with pdfplumber.open(pdf_path) as pdf:
        assets = extract_diagrams(pdf, asset_dir)
        for module in MODULES:
            for raw in segment_module(pdf, module):
                key = f"{module.id}:{raw.number}"
                correction = corrections.get(key, {})
                prompt_lines, raw_options, trailing_lines = split_question(
                    raw,
                    source_option_ids=tuple(
                        correction.get(
                            "sourceOptionIds",
                            ("a", "b", "c", "d"),
                        )
                    ),
                    canonical_option_ids=(
                        tuple(correction["canonicalOptionIds"])
                        if "canonicalOptionIds" in correction
                        else None
                    ),
                )
                detected = detect_correct_options(raw_options, trailing_lines)
                resolution = resolve_correct_option(
                    module.id,
                    raw.number,
                    detected,
                    corrections,
                )
                resolutions[key] = resolution
                if resolution.option_id is None:
                    warnings.append(
                        f"{key} (page {raw.page_start}): {resolution.warning}"
                    )
                    correct_option = ""
                else:
                    correct_option = resolution.option_id

                prompt = list(lines_to_blocks(prompt_lines, module.id))
                diagram = _diagram_block(module.id, raw.number, assets)
                if diagram is not None:
                    prompt.append(diagram)

                options = _corrected_options(correction)
                if options is None:
                    options = tuple(
                        Option(
                            id=raw_option.id,
                            content=lines_to_blocks(
                                raw_option.lines,
                                module.id,
                            ),
                        )
                        for raw_option in raw_options
                    )

                questions.append(
                    Question(
                        id=f"{module.id}-{raw.number:03d}",
                        moduleId=module.id,
                        source=QuestionSource(
                            page=raw.page_start,
                            questionNumber=raw.number,
                        ),
                        content=tuple(prompt),
                        options=options,
                        correctOptionId=correct_option,
                        explanation=explanation_blocks(
                            trailing_lines,
                            module.id,
                        ),
                    )
                )

    dataset = Dataset(
        schemaVersion=1,
        source={
            "title": "Grile Licenta 2026",
            "fileName": pdf_path.name,
            "pageCount": 180,
            "questionCount": 714,
        },
        modules=tuple(
            Module(
                id=module.id,
                name=module.name,
                order=module.order,
                questionCount=module.question_count,
            )
            for module in MODULES
        ),
        questions=tuple(questions),
    )
    return ExtractionResult(
        dataset=dataset,
        warnings=tuple(warnings),
        answer_resolutions=resolutions,
        assets=assets,
    )


def write_json(dataset: Dataset, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(dataset.to_dict(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    corrections = json.loads(CORRECTIONS_PATH.read_text(encoding="utf-8"))
    result = build_dataset(PDF_PATH, corrections, ASSET_DIR)
    issues = validate_dataset(result.dataset, PUBLIC_ROOT)
    write_report(REPORT_PATH, result, issues, corrections)
    if issues or result.warnings:
        print(
            f"Extraction blocked: {len(issues)} validation issues, "
            f"{len(result.warnings)} unresolved warnings."
        )
        return 1
    write_json(result.dataset, DATASET_PATH)
    print("Extracted 714 questions across 15 modules.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
