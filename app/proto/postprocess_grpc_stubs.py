#!/usr/bin/env python3
"""
Modifies method arguments in GRPC stubs: we change them in our middleware. ServicerContext becomes
CouchersContext, and a third parameter, "session: sqlalchemy.orm.Session", is added.
"""

import re
import sys
from typing import Callable

# mypy-protobuf <5 emits "grpc.ServicerContext", >=5 emits "_grpc.ServicerContext"
CONTEXT_PARAM_RE = re.compile(r'^(\s*)context: _?grpc\.ServicerContext,$')


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
    has_orm_import = 'from sqlalchemy import orm' in imports_text
    has_context_import = 'from couchers.context import CouchersContext' in imports_text

    new_imports = []
    if not has_orm_import:
        new_imports.append('from sqlalchemy import orm\n')
    if not has_context_import:
        new_imports.append('from couchers.context import CouchersContext\n')

    if new_imports:
        lines = lines[:insert_idx] + new_imports + lines[insert_idx:]

    return lines


def replace_context_parameter(lines: list[str]) -> tuple[list[str], int]:
    """Replace 'context: grpc.ServicerContext,' with 'context: CouchersContext,\nsession: orm.Session'."""
    new_lines = []
    replaced = 0
    for line in lines:
        match = CONTEXT_PARAM_RE.match(line.rstrip('\n'))
        if match:
            indent = match.group(1)
            new_lines.append(indent + 'context: CouchersContext,\n')
            new_lines.append(indent + 'session: orm.Session,\n')
            replaced += 1
        else:
            new_lines.append(line)
    return new_lines, replaced


def postprocess(file_path: str, log: Callable[..., None]) -> int:
    """Rewrites the servicer method signatures in the file, returning how many were replaced."""
    with open(file_path, 'r') as f:
        lines = f.readlines()

    new_lines = add_imports(lines)
    new_lines, replaced = replace_context_parameter(new_lines)

    # Files without services have nothing to replace, but any ServicerContext left over means the
    # generated stub format changed and our pattern no longer matches it
    if any('ServicerContext' in line for line in new_lines):
        raise RuntimeError(f'{file_path}: found ServicerContext that was not replaced, update postprocess_grpc_stubs.py')

    # Write back to the original file
    with open(file_path, 'w') as f:
        f.writelines(new_lines)

    log(f'{file_path}: added imports and replaced {replaced} context parameters.')
    return replaced


def noop(*_, **__):
    pass


if __name__ == "__main__":
    files = [arg for arg in sys.argv[1:] if arg != "--verbose"]
    if not files:
        print("Usage: python postprocess_grpc_stubs.py [--verbose] <file>...")
        sys.exit(1)

    log = print if "--verbose" in sys.argv else noop
    total = sum(postprocess(file, log=log) for file in files)
    if total == 0:
        raise RuntimeError("No context parameters were replaced in any file, update postprocess_grpc_stubs.py")
