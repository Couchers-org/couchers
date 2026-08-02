"""
Renders every email in every locale with dummy data, as a smoke test that they all build.

Output is written to test_artifacts/emails/ (gitignored) and picked up by CI, which
publishes the browsable index.html to the preview environment.
"""

import base64
import gzip
import json
import re
from pathlib import Path

from couchers.email.dump_emails import dump_all

PAYLOADS_RE = re.compile(r"^const PAYLOADS = (.*);$", re.MULTILINE)


def read_payloads(index_html: str) -> dict[str, dict[str, dict[str, str]]]:
    """Unpacks the inlined bodies back out of the index, undoing the embed() escaping."""
    match = PAYLOADS_RE.search(index_html)
    assert match, "index.html has no inlined payloads"
    encoded = json.loads(match.group(1).replace("<\\/", "</"))
    return {locale: json.loads(gzip.decompress(base64.b64decode(blob))) for locale, blob in encoded.items()}


def test_dump_email_samples(testconfig):
    output_path = Path(__file__).resolve().parents[2] / "test_artifacts" / "emails"
    rendered = dump_all(output_path)

    assert rendered
    assert (output_path / "attachment_imgs" / "logo-with-couchers.org-small.png").exists()

    payloads = read_payloads((output_path / "index.html").read_text(encoding="utf-8"))
    assert payloads
    for locale, bodies in payloads.items():
        for variation in rendered:
            assert variation.subjects[locale]
            assert bodies[variation.name]["html"]
            assert bodies[variation.name]["txt"]


def test_dump_email_index_is_self_contained(testconfig, tmp_path):
    rendered = dump_all(tmp_path, locales=["de", "en"])

    assert sorted(path.name for path in tmp_path.iterdir()) == ["attachment_imgs", "index.html"]

    payloads = read_payloads((tmp_path / "index.html").read_text(encoding="utf-8"))
    assert sorted(payloads) == ["de", "en"]
    for bodies in payloads.values():
        assert sorted(bodies) == sorted(variation.name for variation in rendered)
