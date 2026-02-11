from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from markupsafe import Markup
from typing import ClassVar, Self

from couchers.email.blocks import (
    EmailContent,
    Block,
    ParagraphBlock,
    UserBlock,
    ButtonBlock,
    QuoteBlock,
    UserInfo,
)
from couchers.i18n import LocalizationContext
from couchers.templating import Jinja2Template, template_folder

import xml.etree.ElementTree as xmlET


@dataclass
class EmailBase(ABC):
    """Base class for email templating args."""

    user_name: str

    @staticmethod
    @abstractmethod
    def test_data() -> Self:
        pass


@dataclass
class HostRequestReceived(EmailBase):
    TEMPLATE_FILENAME: ClassVar[str] = "host_request_received.xml"

    surfer: UserInfo
    from_date: date
    to_date: date
    text: str
    view_url: str
    quick_decline_url: str

    @staticmethod
    def test_data() -> HostRequestReceived:
        return HostRequestReceived(
            user_name="Alice",
            surfer=UserInfo(name="Bob", age=42, city="Tokyo", avatar_url="", profile_url=""),
            from_date=date(2000, 1, 1),
            to_date=date(2000, 1, 2),
            text="Hello world!",
            view_url="http://example.com/requests",
            quick_decline_url="http://example.com/quick-decline",
        )


def email_to_blocks(email, loc_context: LocalizationContext) -> EmailContent:
    xml_text = (template_folder / email.__class__.TEMPLATE_FILENAME).read_text(encoding="utf8")
    xml_template = Jinja2Template(source=xml_text, html=True)
    email_element = xmlET.fromstring(xml_template.render(email.__dict__, loc_context))

    blocks: list[Block] = []
    for block_element in email_element:
        match block_element.tag:
            case "para":
                blocks.append(
                    ParagraphBlock(
                        # Preserve HTML from template, placeholders are already sanitized.
                        text=Markup(_get_inner_xml(block_element))
                    )
                )
            case "user":
                attr_name = block_element.attrib.get("attr")
                user_info: UserInfo = getattr(email, attr_name)
                blocks.append(UserBlock(info=user_info, comment=_get_inner_xml(block_element).strip()))
            case "quote":
                blocks.append(
                    QuoteBlock(
                        # Placeholders are already sanitized
                        text=Markup(_get_inner_xml(block_element))
                    )
                )
            case "button":
                blocks.append(
                    ButtonBlock(caption=block_element.attrib["caption"], target_url=block_element.attrib["target-url"])
                )

    return EmailContent(
        subject=email_element.attrib["subject"], preview=email_element.attrib.get("preview"), blocks=blocks
    )


def _get_inner_xml(element: xmlET.Element) -> str | None:
    parts = []
    if element.text:  # Text before the first subelement
        parts.append(element.text)

    for child in element:
        parts.append(xmlET.tostring(child, encoding="unicode"))

    return "".join(parts) if parts else None
