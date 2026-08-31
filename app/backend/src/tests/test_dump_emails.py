"""
Renders sample emails for visual inspection.

Output is written to test_artifacts/emails/ (gitignored) and picked up by CI, which
publishes the browsable index.html to the preview environment.
"""

import json
from pathlib import Path

from couchers.email.dump_emails import dump_all, payload_filename


def test_dump_email_samples(testconfig):
    output_path = Path(__file__).resolve().parents[2] / "test_artifacts" / "emails"
    rendered = dump_all(output_path)

    assert rendered
    index = output_path / "index.html"
    assert index.exists()
    assert (output_path / "attachment_imgs" / "logo-with-couchers.org-small.png").exists()

    locales = {locale for variation in rendered for locale in variation.subjects}
    assert locales
    for locale in locales:
        bodies = json.loads((output_path / payload_filename(locale)).read_text())
        for variation in rendered:
            assert variation.subjects[locale]
            assert bodies[variation.name]["html"]
            assert bodies[variation.name]["txt"]


def test_dump_email_index_inlines_default_locale(testconfig, tmp_path):
    """The index has to render off disk, where a browser blocks fetch()."""
    rendered = dump_all(tmp_path, locales=["de", "en"])

    index_html = (tmp_path / "index.html").read_text()
    # _ordered_locales puts the default locale first, and that's the one inlined
    inlined = json.loads((tmp_path / payload_filename("en")).read_text())
    other = json.loads((tmp_path / payload_filename("de")).read_text())
    for body, present in ((inlined[rendered[0].name], True), (other[rendered[0].name], False)):
        # matches how write_index embeds the payload into the script tag
        encoded = json.dumps(body["html"], ensure_ascii=False).replace("</", "<\\/")
        assert (encoded in index_html) is present
