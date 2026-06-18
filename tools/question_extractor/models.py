from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal


BlockType = Literal["text", "code", "image"]


@dataclass(frozen=True)
class ContentBlock:
    type: BlockType
    value: str | None = None
    language: str | None = None
    src: str | None = None
    alt: str | None = None

    def to_dict(self) -> dict:
        return {
            key: value
            for key, value in asdict(self).items()
            if value is not None
        }


@dataclass(frozen=True)
class Option:
    id: str
    content: tuple[ContentBlock, ...]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "content": [block.to_dict() for block in self.content],
        }


@dataclass(frozen=True)
class QuestionSource:
    page: int
    questionNumber: int


@dataclass(frozen=True)
class Question:
    id: str
    moduleId: str
    source: QuestionSource
    content: tuple[ContentBlock, ...]
    options: tuple[Option, ...]
    correctOptionId: str
    explanation: tuple[ContentBlock, ...] | None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "moduleId": self.moduleId,
            "source": asdict(self.source),
            "content": [block.to_dict() for block in self.content],
            "options": [option.to_dict() for option in self.options],
            "correctOptionId": self.correctOptionId,
            "explanation": (
                [block.to_dict() for block in self.explanation]
                if self.explanation is not None
                else None
            ),
        }


@dataclass(frozen=True)
class Module:
    id: str
    name: str
    order: int
    questionCount: int


@dataclass(frozen=True)
class Dataset:
    schemaVersion: int
    source: dict
    modules: tuple[Module, ...]
    questions: tuple[Question, ...]

    def to_dict(self) -> dict:
        return {
            "schemaVersion": self.schemaVersion,
            "source": self.source,
            "modules": [asdict(module) for module in self.modules],
            "questions": [question.to_dict() for question in self.questions],
        }

