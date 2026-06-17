from couchers.markup import html_to_plaintext, markdown_to_html, markdown_to_plaintext


def test_markdown_to_html() -> None:
    def to_para(span: str) -> str:
        return f"<p>{span}</p>\n"

    assert markdown_to_html("new\nline") == to_para("new<br>\nline")
    assert markdown_to_html("a & b") == to_para("a &amp; b")

    assert markdown_to_html("**bold**") == to_para("<strong>bold</strong>")
    assert markdown_to_html("*italic*") == to_para("<em>italic</em>")
    assert markdown_to_html("_italic_") == to_para("<em>italic</em>")
    assert markdown_to_html('[link](url)') == to_para('<a href="url">link</a>')
    assert markdown_to_html('"quoted"') == to_para('“quoted”')

    assert markdown_to_html('# title') == "<h1>title</h1>\n"
    assert markdown_to_html('- a\n- b') == "<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n"
    assert markdown_to_html('---') == "<hr>\n"


def test_markdown_to_plaintext() -> None:
    assert markdown_to_plaintext("new\nline") == "new\nline"
    assert markdown_to_plaintext("a & b") == "a & b"

    assert markdown_to_plaintext("**bold**") == "bold"
    assert markdown_to_plaintext("_italic_") == "italic"
    assert markdown_to_plaintext("[link](url)") == "link"

    assert markdown_to_plaintext("# title") == "title"


def test_html_to_plaintext() -> None:
    assert html_to_plaintext("new<br>line") == "new\nline"
    assert html_to_plaintext("entity&excl;") == "entity!"
    assert html_to_plaintext("<b>stripped</b>") == "stripped"
    assert html_to_plaintext('<a href="https://example.com">attributes</a>') == "attributes"
    assert html_to_plaintext("</b>malformed<a>") == "malformed"
