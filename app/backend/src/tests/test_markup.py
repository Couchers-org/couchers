from couchers.markup import (
    html_to_plaintext,
    markdown_to_html,
    markdown_to_plaintext,
    plaintext_snippet,
    strip_markdown,
)


def test_markdown_to_html() -> None:
    def to_para(span: str) -> str:
        return f"<p>{span}</p>\n"

    assert markdown_to_html("new\nline") == to_para("new<br>\nline")
    assert markdown_to_html("a & b") == to_para("a &amp; b")

    assert markdown_to_html("**bold**") == to_para("<strong>bold</strong>")
    assert markdown_to_html("*italic*") == to_para("<em>italic</em>")
    assert markdown_to_html("_italic_") == to_para("<em>italic</em>")
    assert markdown_to_html("[link](url)") == to_para('<a href="url">link</a>')
    assert markdown_to_html('"quoted"') == to_para("“quoted”")

    assert markdown_to_html("<script/>") == to_para("&lt;script/&gt;")

    assert markdown_to_html("# title") == "<h1>title</h1>\n"
    assert markdown_to_html("- a\n- b") == "<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n"
    assert markdown_to_html("---") == "<hr>\n"


def test_markdown_to_html_br_tags() -> None:
    def to_para(span: str) -> str:
        return f"<p>{span}</p>\n"

    # <br> tags are emitted by the frontend's markdown editor and rendered by its viewer.
    assert markdown_to_html("a<br>b") == to_para("a<br>\nb")
    assert markdown_to_html("a<br/>b") == to_para("a<br>\nb")
    assert markdown_to_html("a<BR />b") == to_para("a<br>\nb")
    assert markdown_to_html("**a<br>b**") == to_para("<strong>a<br>\nb</strong>")

    # Extra blank lines as written by the frontend's markdown editor
    assert markdown_to_html("Para one\n\n<br>\nPara two") == "<p>Para one</p>\n" + to_para("<br>\n<br>\nPara two")

    # Other tags, including <br> with attributes, remain escaped
    assert markdown_to_html("<br onclick=x>") == to_para("&lt;br onclick=x&gt;")
    assert markdown_to_html("<bra>") == to_para("&lt;bra&gt;")


def test_markdown_to_plaintext() -> None:
    assert markdown_to_plaintext("new\nline") == "new\nline"
    assert markdown_to_plaintext("a & b") == "a & b"

    assert markdown_to_plaintext("**bold**") == "bold"
    assert markdown_to_plaintext("_italic_") == "italic"
    assert markdown_to_plaintext("[link](url)") == "link"

    # By design since plaintext should never be interpreted as markup.
    assert markdown_to_plaintext("<script/>") == "<script/>"

    assert markdown_to_plaintext("# title") == "title"

    assert markdown_to_plaintext("a<br>b") == "a\nb"
    assert markdown_to_plaintext("Para one\n\n<br>\nPara two") == "Para one\n\nPara two"


def test_html_to_plaintext() -> None:
    assert html_to_plaintext("new<br>line") == "new\nline"
    assert html_to_plaintext("entity&excl;") == "entity!"
    assert html_to_plaintext("<b>stripped</b>") == "stripped"
    assert html_to_plaintext("a<script/>b") == "ab"
    assert html_to_plaintext('<a href="https://example.com">attributes</a>') == "attributes"
    assert html_to_plaintext("</b>malformed<a>") == "malformed"


def test_strip_markdown() -> None:
    # Expected values are the output of stripMarkdown in app/web/utils/stripMarkdown.ts
    assert strip_markdown("Hi! I'm **Anna**, a _teacher_ from Berlin.") == "Hi! I'm Anna, a teacher from Berlin."
    assert (
        strip_markdown(
            "# About me\n\nI love hiking.\n\n## Hobbies\n\n- climbing\n- reading\n* cooking\n1. first\n2. second"
        )
        == "About me\n\nI love hiking.\n\nHobbies\n\nclimbing\nreading\ncooking\nfirst\nsecond"
    )
    assert (
        strip_markdown("Check out [my blog](https://example.com) and ![a cat](cat.png).")
        == "Check out my blog and a cat."
    )
    assert strip_markdown("Line one<br>Line two<br/>Line three") == "Line oneLine twoLine three"
    assert strip_markdown("---\n\nAfter a rule\n***\n___") == "\nAfter a rule\n"
    assert strip_markdown("> quoted text\nnot quoted") == "quoted text\nnot quoted"
    assert strip_markdown("Some `inline code` and\n```\nfenced\n```\nafter") == "Some inline code and\nfenced\nafter"


def test_plaintext_snippet() -> None:
    assert plaintext_snippet("**short**", 10) == "short"
    assert plaintext_snippet("exactly ten", 11) == "exactly ten"
    assert plaintext_snippet("one two three", 9) == "one two…"
    assert plaintext_snippet("one two three", 7) == "one two…"
    assert plaintext_snippet("one two\nthree", 10) == "one two…"
    assert plaintext_snippet("[a link](https://example.com/very/long/url) and more", 10) == "a link and…"
    assert plaintext_snippet("unbreakableword", 5) == "unbre…"
