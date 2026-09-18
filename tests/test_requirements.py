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
        for field_id in ("ijsbAmount", "gwlAmount", "ngoAmount"):
            match = re.search(rf'<input[^>]*id="{field_id}"[^>]*>', HTML)
            self.assertIsNotNone(match, field_id)
            assert match is not None
            self.assertNotRegex(match.group(0), r'value="[1-9][0-9]*"')

    def test_amount_fields_use_ten_thousand_dollar_units(self):
        for product in ("IJSB", "GWL", "NGODCR"):
            self.assertIn(f"{product} 保額（萬元）", HTML)
        self.assertNotIn("unitsI=ijsbAmt/10000", HTML)
        self.assertNotIn("unitsG=gwlAmt/10000", HTML)
        self.assertNotIn("unitsN=ngoAmt/10000", HTML)

    def test_blank_amounts_are_explicitly_calculated_as_zero(self):
        for expression in ("unitsI=ijsbAmt", "unitsG=gwlAmt", "unitsN=ngoAmt"):
            self.assertIn(expression, HTML)
        self.assertNotRegex(HTML, r"if\([^\n]*!ijsbAmt[^\n]*!ngoAmt")
        self.assertIn("rateForAmount", HTML)

    def test_ijsb_replaces_ikc_and_includes_all_terms(self):
        self.assertNotIn("IKC", HTML)
        self.assertIn("const IJSB={", HTML)
        self.assertIn('<option value="15">15年繳</option>', HTML)
        self.assertNotIn("IJSB(C)", HTML)
        self.assertIn("IJSB 年繳保費", HTML)
        self.assertIn("IJSB 合計總繳保費", HTML)

    def test_ijsb_underwriting_limits_are_present(self):
        amount = re.search(r'<input[^>]*id="ijsbAmount"[^>]*>', HTML)
        self.assertIsNotNone(amount)
        assert amount is not None
        self.assertIn('max="500"', amount.group(0))
        self.assertIn("const IJSB_MAX_AGE={10:65,15:60,20:55,30:45}", HTML)
        self.assertIn("const IJSB_MIN_AGE=19", HTML)


if __name__ == "__main__":
    unittest.main()
