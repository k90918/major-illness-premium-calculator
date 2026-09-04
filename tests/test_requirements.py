import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")


class CalculatorRequirementsTest(unittest.TestCase):
    def test_personal_information_uses_roc_date_fields(self):
        self.assertIn("<h2>個人資料</h2>", HTML)
        self.assertIn('id="rocYear"', HTML)
        self.assertIn('id="birthMonth"', HTML)
        self.assertIn('id="birthDay"', HTML)
        self.assertNotIn('id="dob" type="date"', HTML)

    def test_ngodcr_has_an_independent_section(self):
        self.assertRegex(HTML, r"<h2>附加\s*NGODCR</h2>")
        self.assertIn('id="ngoAmount"', HTML)

    def test_all_amounts_are_optional_and_default_to_blank(self):
        for field_id in ("ikcAmount", "gwlAmount", "ngoAmount"):
            match = re.search(rf'<input[^>]*id="{field_id}"[^>]*>', HTML)
            self.assertIsNotNone(match, field_id)
            assert match is not None
            self.assertNotRegex(match.group(0), r'value="[1-9][0-9]*"')

    def test_blank_amounts_are_explicitly_calculated_as_zero(self):
        for expression in ("unitsI=ikcAmt/10000", "unitsG=gwlAmt/10000", "unitsN=ngoAmt/10000"):
            self.assertIn(expression, HTML)
        self.assertNotRegex(HTML, r"if\([^\n]*!ikcAmt[^\n]*!ngoAmt")
        self.assertIn("rateForAmount", HTML)


if __name__ == "__main__":
    unittest.main()
