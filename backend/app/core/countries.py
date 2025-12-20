from enum import Enum
from typing import TypedDict, List

class CountryCode(str, Enum):
    RO = "RO"
    NL = "NL"
    FR = "FR"
    BE = "BE"

class CountryRules(TypedDict):
    vat_presets: List[int]
    retention_years: int
    currency: str

COUNTRY_RULES: dict[CountryCode, CountryRules] = {
    CountryCode.RO: {"vat_presets": [0, 5, 9, 19], "retention_years": 10, "currency": "RON"},
    CountryCode.NL: {"vat_presets": [0, 9, 21], "retention_years": 7, "currency": "EUR"},
    CountryCode.FR: {"vat_presets": [0, 5, 10, 20], "retention_years": 10, "currency": "EUR"},
    CountryCode.BE: {"vat_presets": [0, 6, 12, 21], "retention_years": 7, "currency": "EUR"},
}
