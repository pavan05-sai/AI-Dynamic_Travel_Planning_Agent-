from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class LLMProvider(ABC):
    @abstractmethod
    def generate_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generates a structured JSON response conforming to optional schema."""
        pass

    @abstractmethod
    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        """Generates free-text response."""
        pass
