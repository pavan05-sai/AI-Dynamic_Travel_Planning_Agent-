import json
import re
from typing import Any, Dict, Optional
import google.generativeai as genai
from app.core.config import settings
from app.core.errors import ExternalServiceError
from app.core.logging import get_logger
from app.llm.base import LLMProvider

logger = get_logger("gemini_provider")


def extract_json_from_text(text: str) -> Dict[str, Any]:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.LLM_MODEL
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def generate_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.api_key:
            raise ExternalServiceError("Gemini API key is not configured. Falling back to Replay / Baseline.")

        try:
            full_system = (system_instruction or "") + "\n\nCRITICAL: Respond ONLY with a valid JSON object matching the requested schema. No conversational preamble, no markdown formatting outside JSON."
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=full_system
            )
            response = model.generate_content(prompt)
            if not response or not response.text:
                raise ExternalServiceError("Empty response from Gemini")
            return extract_json_from_text(response.text)
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}")
            raise ExternalServiceError(f"Gemini provider error: {str(e)}")

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        if not self.api_key:
            raise ExternalServiceError("Gemini API key is not configured.")

        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text if response and response.text else ""
        except Exception as e:
            logger.warning(f"Gemini text call failed: {e}")
            raise ExternalServiceError(f"Gemini provider error: {str(e)}")
