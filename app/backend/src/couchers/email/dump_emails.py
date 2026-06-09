"""
Dumps emails subjects and html/plaintext bodies with dummy data, plus a browsable
HTML index linking to every rendered email and variation.
"""

import inspect
import re
import sys
from argparse import ArgumentParser
from dataclasses import dataclass
from datetime import UTC
from html import escape
from pathlib import Path

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


@dataclass
class CommandLineArgs:
    filter: str
    outdir: Path
    locale: str

    @staticmethod
    def parse(args: list[str]) -> CommandLineArgs:
        parser = ArgumentParser(description=__doc__)
        parser.add_argument("--filter", type=str, default="*", help="A filter for email classes to dump.")
        parser.add_argument(
            "--outdir", type=Path, default=template_folder, help="The directory to write email bodies to."
        )
        parser.add_argument("--locale", type=str, default="en", help="The locale to use.")
        parsed_args = parser.parse_args(args)
        return CommandLineArgs(**parsed_args.__dict__)


@dataclass
class RenderedVariation:
    email_class: str
    variation: int
    variation_count: int
    subject: str
    html_filename: str
    plaintext_filename: str


def dump_all(outdir: Path, *, filter_glob: str = "*", locale: str = "en") -> list[RenderedVariation]:
    """Dumps all emails matching the filter to outdir and writes a browsable index.html.

    Requires the relevant config (e.g. BASE_URL) to be available, as when run inside the
    test harness or with the deployment environment loaded.
    """
    loc_context = LocalizationContext(locale=locale, timezone=UTC)
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
                subject = dump_email(test_instances[i], footer, loc_context, outdir / filename_no_ext)
                rendered.append(
                    RenderedVariation(
                        email_class=email_class.__name__,
                        variation=i,
                        variation_count=len(test_instances),
                        subject=subject,
                        html_filename=f"{filename_no_ext}.html",
                        plaintext_filename=f"{filename_no_ext}.txt",
                    )
                )

    write_index(outdir / "index.html", rendered, locale)
    return rendered


def dump_email(email: EmailBase, footer: EmailFooter, loc_context: LocalizationContext, filepath_no_ext: Path) -> str:
    """Dumps an email's subject and plaintext+html body to a file, returning the subject line."""
    subject_line = email.get_subject_line(loc_context)
    preview_line = email.get_preview_line(loc_context)
    blocks = email.get_body_blocks(loc_context)

    filepath_no_ext.parent.mkdir(parents=True, exist_ok=True)

    print(f"Dumping email class {email.__class__.__name__}")
    print(f"  Subject: {subject_line}")

    html_path = filepath_no_ext.with_suffix(".html")
    print(f"  Rendering html to {html_path}...")
    html = render_html_body(
        subject=subject_line, preview=preview_line, blocks=blocks, footer=footer, loc_context=loc_context
    )
    html_path.write_text(html)

    plaintext_path = filepath_no_ext.with_suffix(".txt")
    print(f"  Rendering plaintext to {plaintext_path}...")
    plaintext = render_plaintext_body(blocks=blocks, footer=footer, loc_context=loc_context)
    plaintext_path.write_text(plaintext)

    return subject_line


def write_index(index_path: Path, rendered: list[RenderedVariation], locale: str) -> None:
    """Writes a browsable HTML index linking to every rendered email and variation."""
    rows: list[str] = []
    for r in sorted(rendered, key=lambda r: (r.email_class, r.variation)):
        variation_label = f"#{r.variation}" if r.variation_count > 1 else "—"
        rows.append(
            "<tr>"
            f"<td class='cls'>{escape(r.email_class)}</td>"
            f"<td class='var'>{variation_label}</td>"
            f"<td class='subj'>{escape(r.subject)}</td>"
            f"<td><a href='{escape(r.html_filename)}'>HTML</a></td>"
            f"<td><a href='{escape(r.plaintext_filename)}'>plaintext</a></td>"
            "</tr>"
        )

    class_count = len({r.email_class for r in rendered})
    index_html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Couchers.org sample emails</title>
<style>
  :root {{ color-scheme: light dark; }}
  body {{ font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2rem;
         line-height: 1.5; }}
  h1 {{ margin: 0 0 .25rem; font-size: 1.5rem; }}
  p.meta {{ margin: 0 0 1.5rem; opacity: .7; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ text-align: left; padding: .5rem .75rem; border-bottom: 1px solid rgba(128,128,128,.25);
           vertical-align: top; }}
  th {{ position: sticky; top: 0; background: Canvas; font-weight: 600; }}
  td.cls {{ font-weight: 600; white-space: nowrap; }}
  td.var {{ opacity: .7; white-space: nowrap; }}
  td.subj {{ width: 100%; }}
  a {{ white-space: nowrap; }}
  tbody tr:hover {{ background: rgba(128,128,128,.08); }}
</style>
</head>
<body>
<h1>Couchers.org sample emails</h1>
<p class="meta">{len(rendered)} rendered variation(s) across {class_count} email type(s), locale <code>{escape(locale)}</code>.</p>
<table>
<thead>
<tr><th>Email</th><th>Variation</th><th>Subject</th><th></th><th></th></tr>
</thead>
<tbody>
{chr(10).join(rows)}
</tbody>
</table>
</body>
</html>
"""
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(index_html)
    print(f"Wrote index of {len(rendered)} variation(s) to {index_path}")


def main() -> None:
    args = CommandLineArgs.parse(sys.argv[1:])
    dump_all(args.outdir, filter_glob=args.filter, locale=args.locale)


if __name__ == "__main__":
    main()
