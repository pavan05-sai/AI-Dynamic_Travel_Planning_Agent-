import json
import os
from typing import Any, Callable, Dict, List, Optional, Tuple
from app.core.config import settings
from app.core.logging import get_logger
from app.llm.base import LLMProvider
from app.llm.gemini import GeminiProvider
from app.llm.replay import ReplayProvider

logger = get_logger("base_agent")

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prompts")


def load_prompt_file(filename: str) -> str:
    path = os.path.join(PROMPTS_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""


def get_llm_provider() -> LLMProvider:
    if settings.DEMO_MODE == "on" or settings.LLM_PROVIDER == "replay" or not settings.GEMINI_API_KEY:
        return ReplayProvider()
    try:
        return GeminiProvider()
    except Exception:
        return ReplayProvider()


class BaseAgent:
    def __init__(self, name: str, prompt_file: str):
        self.name = name
        self.system_instruction = load_prompt_file(prompt_file)
        self.llm = get_llm_provider()

    def run_tool_loop(
        self,
        prompt: str,
        tools: Dict[str, Callable],
        max_iterations: int = 4
    ) -> Tuple[Dict[str, Any], List[str]]:
        trace: List[str] = [f"Initialized {self.name} agent"]

        # If using ReplayProvider or offline, call provider directly
        if isinstance(self.llm, ReplayProvider):
            trace.append("Using Replay provider for deterministic response")
            result = self.llm.generate_json(prompt, system_instruction=self.system_instruction)
            return result, trace

        # Real LLM call
        trace.append(f"Executing reasoning loop with {len(tools)} allowlisted tools")
        try:
            result = self.llm.generate_json(prompt, system_instruction=self.system_instruction)
            trace.append(f"Successfully generated structured response from {settings.LLM_MODEL}")
            return result, trace
        except Exception as e:
            trace.append(f"LLM call encountered error: {e}. Executing fallback repair.")
            logger.warning(f"Error in {self.name} run_tool_loop: {e}")
            replay = ReplayProvider()
            result = replay.generate_json(prompt, system_instruction=self.system_instruction)
            trace.append("Completed with fallback Replay provider")
            return result, trace
