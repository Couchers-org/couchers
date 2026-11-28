from couchers.markup import html_to_plaintext, markdown_to_html, markdown_to_plaintext


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
    assert markdown_to_plaintext("# title\nbody") == "title\n\nbody"

    assert markdown_to_plaintext("a<br>b") == "a\nb"
    # Extra blank lines from <br> tags are preserved
    assert markdown_to_plaintext("Para one\n\n<br>\nPara two") == "Para one\n\n\n\nPara two"


def test_markdown_to_plaintext_blocks() -> None:
    # Paragraphs are separated by a blank line, whitespace-only lines collapse
    assert markdown_to_plaintext("a\n\nb") == "a\n\nb"
    assert markdown_to_plaintext("a\n \nb") == "a\n\nb"
    assert markdown_to_plaintext("a\n\n\n\nb") == "a\n\nb"


def test_markdown_to_plaintext_lists() -> None:
    assert markdown_to_plaintext("x\n\n- a\n- b\n\ny") == "x\n\n- a\n- b\n\ny"
    assert markdown_to_plaintext("1. a\n2. b") == "1. a\n2. b"
    assert markdown_to_plaintext("3. a\n4. b") == "3. a\n4. b"
    # Nested list
    assert markdown_to_plaintext("- a\n  - b\n- c") == "- a\n  - b\n- c"


def test_html_to_plaintext() -> None:
    assert html_to_plaintext("new<br>line") == "new\nline"
    assert html_to_plaintext("entity&excl;") == "entity!"
    assert html_to_plaintext("<b>stripped</b>") == "stripped"
    assert html_to_plaintext("a<script/>b") == "ab"
    assert html_to_plaintext('<a href="https://example.com">attributes</a>') == "attributes"
    assert html_to_plaintext("</b>malformed<a>") == "malformed"
    assert html_to_plaintext("<p>a</p>\n<p>b</p>\n") == "a\n\nb"
    assert html_to_plaintext("<ul><li>a</li><li>b</li></ul>") == "- a\n- b"
    assert html_to_plaintext("<ul><li>a</li></ul>b") == "- a\n\nb"
