from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from markupsafe import Markup
from typing import ClassVar, Self

from couchers.email.blocks import Email as BlocksEmail
from couchers.email.blocks import EmailBlock, ParagraphBlock, UserBlock, ButtonBlock, QuoteBlock, UserInfo
from couchers.i18n import LocalizationContext
from couchers.templating import Jinja2Template, template_folder

import xml.etree.ElementTree as xmlET


@dataclass
class EmailBase(ABC):
    user_name: str

    @staticmethod
    @abstractmethod
    def test_data() -> Self:
        pass

    @abstractmethod
    def get_user_info(self, id: str | None) -> UserInfo:
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

    def get_user_info(self, id: str | None) -> UserInfo:
        return self.surfer

    @staticmethod
    def test_data() -> HostRequestReceived:
        return HostRequestReceived(
            user_name="Alice",
            surfer=UserInfo(name="Bob", age=42, city="Tokyo", avatar_url="", profile_url=""),
            from_date=date(2000, 1, 1),
            to_date=date(2000, 1, 2),
            view_url="",
            quick_decline_url=""
        )



def email_to_blocks(email, loc_context: LocalizationContext) -> BlocksEmail:
    xml_text = (template_folder / email.__class__.TEMPLATE_FILENAME).read_text(encoding="utf8")
    xml_template = Jinja2Template(source=xml_text, html=True)
    email_element = xmlET.fromstring(xml_template.render(email.__dict__, loc_context))

    blocks: list[EmailBlock] = []
    for block_element in email_element:
        match block_element.tag:
            case "para":
                blocks.append(ParagraphBlock(
                    # Preserve HTML from template, placeholders are already sanitized.
                    text=Markup(_get_inner_xml(block_element))
                ))
            case "user":
                user_info_id = block_element.attrib.get("id")
                blocks.append(UserBlock(
                    info=email.get_user_info(user_info_id),
                    comment=_get_inner_xml(block_element)
                ))
            case "quote":
                blocks.append(QuoteBlock(
                    # Placeholders are already sanitized
                    text=Markup(_get_inner_xml(block_element))
                ))
            case "button":
                blocks.append(ButtonBlock(
                    caption=block_element.attrib["caption"],
                    target_url=block_element.attrib["target-url"]
                ))

    return BlocksEmail(
        subject=email_element.attrib["subject"],
        preview=email_element.attrib.get("preview"),
        blocks=blocks
    )

def _get_inner_xml(element: xmlET.Element) -> str | None:
    if len(element) == 0:
        return None
    # Join the string representation of every child element
    return ''.join(xmlET.tostring(child, encoding='unicode') for child in element)
