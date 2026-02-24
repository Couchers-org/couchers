"""
Dumps emails subjects and html/plaintext bodies with dummy data.
"""

import inspect
import re
import sys
from argparse import ArgumentParser
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo

import couchers.email.emails
from couchers.email.emails import EmailBase
from couchers.email.rendering import (
    EmailFooter,
    UnsubscribeInfo,
    UnsubscribeLink,
    render_html_body,
    render_plaintext_body,
)
from couchers.i18n import LocalizationContext
from couchers.templating import template_folder


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


def main() -> None:
    args = CommandLineArgs.parse(sys.argv[1:])
    loc_context = LocalizationContext(locale=args.locale, timezone=ZoneInfo("Etc/UTC"))

    footer = EmailFooter(
        unsubscribe_info=UnsubscribeInfo(
            manage_notifications_url="https://example.com/manage-notifications",
            do_not_email_url="https://example.com/do-not-email",
            topic_action_link=UnsubscribeLink(text="topic-action", url="https://example.com/unsubscribe"),
        )
    )

    filter_regex = re.compile(re.escape(args.filter).replace(r"\*", ".*?"))

    for _, klass in inspect.getmembers(couchers.email.emails, lambda o: inspect.isclass(o) and o.__base__ == EmailBase):
        email_class: type[EmailBase] = klass
        if filter_regex.fullmatch(email_class.__name__):
            dump_email(email_class.dummy_data(), footer, loc_context, args.outdir)


def dump_email(email: EmailBase, footer: EmailFooter, loc_context: LocalizationContext, outdir: Path) -> None:
    """Dumps an email's subject and plaintext+html body to a file."""
    subject_line = email.get_subject_line(loc_context)
    preview_line = email.get_preview_line(loc_context)
    blocks = email.get_body_blocks(loc_context)

    outdir.mkdir(exist_ok=True)

    print(f"Dumping email class {email.__class__.__name__}")
    print(f"  Subject: {subject_line}")

    html_path = outdir / f"{email.__class__.__name__}.html"
    print(f"  Rendering html to {html_path}...")
    html = render_html_body(
        subject=subject_line, preview=preview_line, blocks=blocks, footer=footer, loc_context=loc_context
    )
    html_path.write_text(html)

    plaintext_path = outdir / f"{email.__class__.__name__}.txt"
    print(f"  Rendering plaintext to {plaintext_path}...")
    plaintext = render_plaintext_body(blocks=blocks, footer=footer, loc_context=loc_context)
    plaintext_path.write_text(plaintext)


if __name__ == "__main__":
    main()
