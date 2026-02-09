from argparse import ArgumentParser
from dataclasses import dataclass
import sys

import couchers.email.email_data
from couchers.email.email_data import EmailBase, email_to_blocks
from couchers.email.blocks import get_html_renderer, get_plaintext_renderer
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
            email_class=parsed_args["class"]
        )

def main() -> None:
    args = CommandLineArgs.parse(sys.argv[1:])
    email_class = getattr(couchers.email.email_data, args.email_class)
    email: EmailBase = email_class.test_data()
    loc_context = LocalizationContext.en_utc()
    blocks_email = email_to_blocks(email, loc_context)
    html = get_html_renderer().render(blocks_email, loc_context)
    plaintext = get_plaintext_renderer().render(blocks_email, loc_context)
    (template_folder / f"{args.email_class}.html").write_text(html)
    (template_folder / f"{args.email_class}.txt").write_text(plaintext)
