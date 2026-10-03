from typing import Dict


class ProvenanceSource:
    LIVE = "live"
    CACHE = "cache"
    STATIC = "catalog"
    DEMO = "demo"
    SIMULATED = "simulated"
    ESTIMATED = "estimated"
    BASELINE = "baseline"


def build_provenance_meta(
    weather: str = ProvenanceSource.DEMO,
    routing: str = ProvenanceSource.ESTIMATED,
    places: str = ProvenanceSource.STATIC,
    llm: str = ProvenanceSource.LIVE,
    overall: str = "live_with_fallbacks"
) -> Dict[str, str]:
    return {
        "weather": weather,
        "routing": routing,
        "places": places,
        "llm": llm,
        "overall": overall
    }
