from argparse import ArgumentParser
from dataclasses import dataclass
import sys

import couchers.email.emails
from couchers.email.emails import EmailBase, email_to_blocks
from couchers.email.blocks import EmailFooter, UnsubscribeInfo, UnsubscribeLink, get_html_renderer, get_plaintext_renderer
from couchers.i18n import LocalizationContext
from couchers.templating import template_folder

@dataclass
class CommandLineArgs:
    email_class: str

    @staticmethod
    def parse(args: list[str]) -> CommandLineArgs:
        parser = ArgumentParser()
        parser.add_argument("class")
        parsed_args = parser.parse_args(args)
        return CommandLineArgs(
            email_class=getattr(parsed_args, "class")
        )

def main() -> None:
    args = CommandLineArgs.parse(sys.argv[1:])
    email_class = getattr(couchers.email.emails, args.email_class)
    email: EmailBase = email_class.test_data()
    loc_context = LocalizationContext.en_utc()
    email_content = email_to_blocks(email, loc_context)

    email_footer = EmailFooter(
        unsubscribe_info=UnsubscribeInfo(
            manage_notifications_url="http://example.com/manage-notifications",
            do_not_email_url="http://example.com/do-not-email",
            topic_action_link=UnsubscribeLink(text="topic-action", url="http://example.com/unsubscribe")
        )
    )

    html_path = template_folder / f"{args.email_class}.html"
    print(f"Rendering html to {html_path}...")
    html = get_html_renderer().render(email_content, email_footer, loc_context)
    html_path.write_text(html)

    plaintext_path = template_folder / f"{args.email_class}.txt"
    print(f"Rendering plaintext to {plaintext_path}...")
    plaintext = get_plaintext_renderer().render(email_content, email_footer, loc_context)
    plaintext_path.write_text(plaintext)

if __name__ == "__main__":
    main()
