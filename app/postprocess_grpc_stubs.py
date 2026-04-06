#!/usr/bin/env python3
"""
Modifies method arguments in GRPC stubs: we change them in our middleware. ServicerContext becomes
CouchersContext, and a third parameter, "db: DB", is added.
"""

import sys
from typing import Callable


def add_imports(lines: list[str]) -> list[str]:
    """Add required imports at the beginning of the file if not already present."""
    # Find where to insert imports (after the docstring and existing imports)
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import ') or line.startswith('from '):
            insert_idx = i + 1
        elif line.strip() and not line.startswith('"""') and not line.startswith("'''"):
            # Stop if we hit non-import code
            break

    # Check if imports already exist
    imports_text = ''.join(lines)
    has_db_import = 'from couchers.repositories import DB' in imports_text
    has_context_import = 'from couchers.context import CouchersContext' in imports_text

    new_imports = []
    if not has_db_import:
        new_imports.append('from couchers.repositories import DB\n')
    if not has_context_import:
        new_imports.append('from couchers.context import CouchersContext\n')

    if new_imports:
        lines = lines[:insert_idx] + new_imports + lines[insert_idx:]

    return lines


def replace_context_parameter(lines: list[str]) -> list[str]:
    """Replace 'context: grpc.ServicerContext,' with 'context: CouchersContext,\ndb: DB'."""
    new_lines = []
    for line in lines:
        if 'context: grpc.ServicerContext,' in line:
            # Get the indentation
            indent = len(line) - len(line.lstrip())
            # Replace the line
            new_lines.append(' ' * indent + 'context: CouchersContext,\n')
            new_lines.append(' ' * indent + 'db: DB,\n')
        else:
            new_lines.append(line)
    return new_lines


def postprocess(file_path: str, log: Callable[..., None]) -> None:
    """Delete content between the marker lines in the file."""
    with open(file_path, 'r') as f:
        lines = f.readlines()

    new_lines = add_imports(lines)
    new_lines = replace_context_parameter(new_lines)

    # Write back to the original file
    with open(file_path, 'w') as f:
        f.writelines(new_lines)

    log("Added imports and replaced context parameter.")


def noop(*_, **__):
    pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python postprocess_grpc_stubs.py <file>")
        sys.exit(1)

    file = sys.argv[1]
    postprocess(file, log=print if "--verbose" in sys.argv else noop)
