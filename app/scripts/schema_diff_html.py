#!/usr/bin/env python3
"""Render an HTML page diffing two SQL schema dumps (develop vs this branch).

Usage: schema_diff_html.py <old.sql> <new.sql> <out.html>

A missing old file (e.g. develop's schema not published yet) diffs against
empty, so the page shows the whole schema as added rather than failing.
"""

import difflib
import sys


def read_lines(path):
    try:
        with open(path) as f:
            return f.read().splitlines()
    except FileNotFoundError:
        return []


def main():
    old_path, new_path, out_path = sys.argv[1:4]
    html = difflib.HtmlDiff(wrapcolumn=100).make_file(
        read_lines(old_path),
        read_lines(new_path),
        fromdesc="develop",
        todesc="this branch",
        context=True,
        numlines=3,
    )
    with open(out_path, "w") as f:
        f.write(html)


if __name__ == "__main__":
    main()
