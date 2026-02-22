import sys
from argparse import ArgumentParser
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo

import couchers.email.emails
from couchers.email.rendering import (
    EmailFooter,
    UnsubscribeInfo,
    UnsubscribeLink,
    render_html_body,
    render_plaintext_body,
)
from couchers.email.emails import EmailBase
from couchers.i18n import LocalizationContext
from couchers.templating import template_folder


@dataclass
class CommandLineArgs:
    email_class: str
    outdir: Path
    locale: str

    @staticmethod
    def parse(args: list[str]) -> CommandLineArgs:
        parser = ArgumentParser()
        parser.add_argument("class")
        parser.add_argument("--outdir", type=Path, default=template_folder)
        parser.add_argument("--locale", default="en")
        parsed_args = parser.parse_args(args)
        return CommandLineArgs(
            **parsed_args.__dict__)


def main() -> None:
    args = CommandLineArgs.parse(sys.argv[1:])
    loc_context = LocalizationContext(locale=args.locale, timezone=ZoneInfo("Etc/UTC"))

    email_class = getattr(couchers.email.emails, args.email_class)
    email: EmailBase = email_class.test_data()

    subject_line = email.get_subject_line(loc_context)
    preview_line = email.get_preview_line(loc_context)
    blocks = email.get_body_blocks(loc_context)

    footer = EmailFooter(
        unsubscribe_info=UnsubscribeInfo(
            manage_notifications_url="http://example.com/manage-notifications",
            do_not_email_url="http://example.com/do-not-email",
            topic_action_link=UnsubscribeLink(text="topic-action", url="http://example.com/unsubscribe"),
        )
    )

    print(f"Subject: {subject_line}")

    html_path = args.outdir / f"{args.email_class}.html"
    print(f"Rendering html to {html_path}...")
    html = render_html_body(subject=subject_line, preview=preview_line, blocks=blocks, footer=footer, loc_context=loc_context)
    html_path.write_text(html)

    plaintext_path = args.outdir / f"{args.email_class}.txt"
    print(f"Rendering plaintext to {plaintext_path}...")
    plaintext = render_plaintext_body(blocks=blocks, footer=footer, loc_context=loc_context)
    plaintext_path.write_text(plaintext)


if __name__ == "__main__":
    main()
