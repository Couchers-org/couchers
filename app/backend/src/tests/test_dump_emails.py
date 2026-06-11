"""
Renders sample emails for visual inspection.

Output is written to test_artifacts/emails/ (gitignored) and picked up by CI, which
publishes the browsable index.html to the preview environment.
"""

from pathlib import Path

from couchers.email.dump_emails import dump_all


def test_dump_email_samples(testconfig):
    output_path = Path(__file__).resolve().parents[2] / "test_artifacts" / "emails"
    rendered = dump_all(output_path)

    assert rendered
    index = output_path / "index.html"
    assert index.exists()
    assert (output_path / "attachment_imgs" / "logo-with-couchers.org-small.png").exists()
    for variation in rendered:
        assert variation.subjects
        for locale in variation.subjects:
            assert (output_path / locale / variation.html_filename).exists()
            assert (output_path / locale / variation.plaintext_filename).exists()
