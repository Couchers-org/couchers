"""
Dumps emails subjects and html/plaintext bodies with dummy data in every supported
locale, plus a browsable HTML index with a locale selector and expandable previews.
"""

import inspect
import json
import re
import shutil
import sys
from argparse import ArgumentParser
from dataclasses import dataclass
from datetime import UTC
from pathlib import Path

from markupsafe import Markup

import couchers.email.emails
from couchers.email.emails import EmailBase
from couchers.email.rendering import (
    EmailFooter,
    UnsubscribeInfo,
    UnsubscribeLink,
    render_html_body,
    render_plaintext_body,
    template_folder,
)
from couchers.i18n import LocalizationContext
from couchers.i18n.locales import DEFAULT_LOCALE, get_supported_locales
from couchers.templating import Jinja2Template


@dataclass
class CommandLineArgs:
    filter: str
    outdir: Path
    locales: str

    @staticmethod
    def parse(args: list[str]) -> CommandLineArgs:
        parser = ArgumentParser(description=__doc__)
        parser.add_argument("--filter", type=str, default="*", help="A filter for email classes to dump.")
        parser.add_argument(
            "--outdir", type=Path, default=template_folder, help="The directory to write email bodies to."
        )
        parser.add_argument(
            "--locales",
            type=str,
            default="all",
            help='Comma-separated locales to render, or "all" for every supported locale.',
        )
        parsed_args = parser.parse_args(args)
        return CommandLineArgs(**parsed_args.__dict__)


@dataclass
class RenderedVariation:
    email_class: str
    variation: int
    variation_count: int
    subjects: dict[str, str]  # locale -> subject line
    name: str  # filename without extension, relative to the locale directory

    @property
    def html_filename(self) -> str:
        return f"{self.name}.html"

    @property
    def plaintext_filename(self) -> str:
        return f"{self.name}.txt"


def _ordered_locales(locales: list[str] | None) -> list[str]:
    if locales is None:
        locales = get_supported_locales()
    return sorted(locales, key=lambda locale: (locale != DEFAULT_LOCALE, locale))


def dump_all(outdir: Path, *, filter_glob: str = "*", locales: list[str] | None = None) -> list[RenderedVariation]:
    """Dumps all emails matching the filter to outdir (one subdirectory per locale) and
    writes a browsable index.html with a locale selector and expandable previews.

    Requires the relevant config (e.g. BASE_URL) to be available, as when run inside the
    test harness or with the deployment environment loaded.
    """
    locales = _ordered_locales(locales)
    footer = EmailFooter(
        timezone_name="UTC",
        unsubscribe_info=UnsubscribeInfo(
            manage_notifications_url="https://example.com/manage-notifications",
            do_not_email_url="https://example.com/do-not-email",
            topic_action_link=UnsubscribeLink(text="topic-action", url="https://example.com/unsubscribe"),
        ),
    )
    filter_regex = re.compile(re.escape(filter_glob).replace(r"\*", ".*?"))

    rendered: list[RenderedVariation] = []
    # Iterate over all email classes and dump their test instances if they match the filter
    for _, klass in inspect.getmembers(couchers.email.emails, lambda o: inspect.isclass(o) and o.__base__ == EmailBase):
        email_class: type[EmailBase] = klass
        if filter_regex.fullmatch(email_class.__name__):
            test_instances = email_class.test_instances()
            for i in range(len(test_instances)):
                filename_no_ext = email_class.__name__
                if len(test_instances) > 1:
                    filename_no_ext += f"_{i}"
                print(f"Dumping email class {email_class.__name__} ({len(locales)} locale(s))")
                subjects = {}
                for locale in locales:
                    loc_context = LocalizationContext(locale=locale, timezone=UTC)
                    subjects[locale] = dump_email(
                        test_instances[i], footer, loc_context, outdir / locale / filename_no_ext
                    )
                rendered.append(
                    RenderedVariation(
                        email_class=email_class.__name__,
                        variation=i,
                        variation_count=len(test_instances),
                        subjects=subjects,
                        name=filename_no_ext,
                    )
                )

    if rendered:
        shutil.copytree(template_folder / "attachment_imgs", outdir / "attachment_imgs", dirs_exist_ok=True)

    write_index(outdir / "index.html", rendered, locales)
    return rendered


def dump_email(email: EmailBase, footer: EmailFooter, loc_context: LocalizationContext, filepath_no_ext: Path) -> str:
    """Dumps an email's subject and plaintext+html body to a file, returning the subject line."""
    subject_line = email.get_subject_line(loc_context)
    preview_line = email.get_preview_line(loc_context)
    blocks = email.get_body_blocks(loc_context)

    filepath_no_ext.parent.mkdir(parents=True, exist_ok=True)

    html = render_html_body(
        subject=subject_line, preview=preview_line, blocks=blocks, footer=footer, loc_context=loc_context
    )
    html = html.replace("attachment_imgs/", "../attachment_imgs/")
    filepath_no_ext.with_suffix(".html").write_text(html)

    plaintext = render_plaintext_body(blocks=blocks, footer=footer, loc_context=loc_context)
    filepath_no_ext.with_suffix(".txt").write_text(plaintext)

    return subject_line


def write_index(index_path: Path, rendered: list[RenderedVariation], locales: list[str]) -> None:
    """Writes a browsable HTML index with a locale selector and an accordion entry per
    rendered email variation, expanding to side-by-side HTML and plaintext previews."""
    rendered = sorted(rendered, key=lambda r: (r.email_class, r.variation))
    # Guard against a literal "</script>" in subject lines breaking out of the script tag
    subjects_json = json.dumps({r.name: r.subjects for r in rendered}, ensure_ascii=False).replace("</", "<\\/")
    template = Jinja2Template(source=(Path(__file__).parent / "dump_emails_index.html.jinja2").read_text(), html=True)
    index_html = template.render(
        {
            "rendered": rendered,
            "locales": locales,
            "class_count": len({r.email_class for r in rendered}),
            "subjects_json": Markup(subjects_json),
        }
    )
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(index_html)
    print(f"Wrote index of {len(rendered)} variation(s) in {len(locales)} locale(s) to {index_path}")


def main() -> None:
    args = CommandLineArgs.parse(sys.argv[1:])
    locales = None if args.locales == "all" else args.locales.split(",")
    dump_all(args.outdir, filter_glob=args.filter, locales=locales)


if __name__ == "__main__":
    main()
