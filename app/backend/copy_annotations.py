#!/usr/bin/env python3
"""
Copy type annotations from .pyi stub files to implementation files.

This script:
1. Reads .pyi files from proto/ directory
2. Extracts parameter and return type annotations from abstract methods
3. Copies annotations to corresponding implementation files in servicers/
4. For Union return types (sync | async), extracts only the sync variant
"""

import sys
from pathlib import Path

import libcst as cst
from libcst import matchers as m


class PyiMethodExtractor(cst.CSTVisitor):
    """Extract method signatures from .pyi files."""

    def __init__(self):
        super().__init__()
        self.methods = {}  # method_name -> (params, return_type)

    def visit_FunctionDef(self, node: cst.FunctionDef) -> None:
        """Extract function signatures."""
        method_name = node.name.value

        # Get parameter annotations
        params = {}
        for param in node.params.params:
            param_name = param.name.value
            if param.annotation:
                params[param_name] = param.annotation.annotation

        return_type = node.returns.annotation if node.returns else None

        if return_type:
            self.methods[method_name] = (params, return_type)


class UnionReturnExtractor(cst.CSTVisitor):
    """Extract the sync type from Union[SyncType, Awaitable[AsyncType]]."""

    def __init__(self):
        super().__init__()
        self.sync_type = None

    def visit_Subscript(self, node: cst.Subscript) -> None:
        """Handle Union[...] subscripts."""
        # Check if this is a Union
        if m.matches(node.value, m.Attribute(value=m.Name("typing"), attr=m.Name("Union"))) or m.matches(
            node.value, m.Name("Union")
        ):
            # Extract elements from Union
            slice_value = node.slice
            # If it's a Tuple with subscript elements
            if hasattr(slice_value, "value"):
                if isinstance(slice_value.value, cst.Tuple):
                    elements = slice_value.value.elements
                else:
                    elements = [slice_value.value]
            elif isinstance(slice_value, cst.Tuple):
                elements = slice_value.elements
            else:
                elements = [slice_value] if slice_value else []

            # Process elements - first is typically the sync type
            if elements:
                first_elem = elements[0]
                if isinstance(first_elem, cst.Element):
                    self.sync_type = first_elem.value
                else:
                    self.sync_type = first_elem


def extract_sync_return_type(return_annotation: cst.Annotation) -> cst.Annotation | None:
    """
    Extract sync type from Union[SyncType, Awaitable[AsyncType]].

    For return type annotations like:
    typing.Union[account_pb2.GetAccountInfoRes, collections.abc.Awaitable[account_pb2.GetAccountInfoRes]]

    Extract only: account_pb2.GetAccountInfoRes
    """
    if not return_annotation:
        return None

    annotation_code = return_annotation.annotation

    # Check if it's a Union type
    if m.matches(
        annotation_code,
        m.Subscript(value=m.OneOf(m.Attribute(value=m.Name("typing"), attr=m.Name("Union")), m.Name("Union"))),
    ):
        subscript = annotation_code
        slice_value = subscript.slice

        # Extract the first element of the Union
        # slice_value is a tuple of SubscriptElement objects
        if isinstance(slice_value, (tuple, list)) and slice_value:
            first_elem = slice_value[0]
            if isinstance(first_elem, cst.SubscriptElement):
                # Extract the value from the Index inside the SubscriptElement
                if isinstance(first_elem.slice, cst.Index):
                    sync_type = first_elem.slice.value
                    return cst.Annotation(annotation=sync_type)
            elif isinstance(first_elem, cst.Element):
                sync_type = first_elem.value
                return cst.Annotation(annotation=sync_type)
            else:
                # Fallback
                return cst.Annotation(annotation=first_elem)

    # Not a Union, return as-is
    return return_annotation


def get_pyi_methods(pyi_file: Path) -> dict[str, tuple[dict, cst.Annotation]]:
    """Extract method signatures from a .pyi file."""
    try:
        with open(pyi_file) as f:
            code = f.read()

        tree = cst.parse_module(code)
    except Exception as e:
        print(f"Error parsing {pyi_file}: {e}", file=sys.stderr)
        return {}

    methods = {}

    for node in tree.body:
        if isinstance(node, cst.ClassDef):
            # Iterate through class methods
            for class_item in node.body.body:
                if isinstance(class_item, cst.FunctionDef):
                    method_name = class_item.name.value

                    # Extract parameter types
                    params = {}
                    for param in class_item.params.params:
                        param_name = param.name.value
                        if param.annotation:
                            params[param_name] = param.annotation.annotation

                    # Extract return type and extract sync variant
                    if class_item.returns:
                        sync_return = extract_sync_return_type(class_item.returns)
                        methods[method_name] = (params, sync_return)

    return methods


def normalize_annotation(annotation: cst.BaseExpression) -> cst.BaseExpression:
    """
    Normalize type annotations:
    - google.X.*_pb2.Y -> *_pb2.Y (remove google.X prefix)
    - repositories.DB -> DB
    """
    # Handle google.X.something_pb2.Something -> something_pb2.Something
    if isinstance(annotation, cst.Attribute):
        # Try to match google.X.*_pb2.Y pattern
        if isinstance(annotation.value, cst.Attribute):
            middle = annotation.value
            if isinstance(middle.value, cst.Attribute):
                inner = middle.value
                if isinstance(inner.value, cst.Name) and inner.value.value == "google":
                    # We have google.X.*_pb2.Y pattern
                    # middle.attr is the *_pb2 module name
                    pb2_module = middle.attr.value if isinstance(middle.attr, cst.Name) else None
                    if pb2_module and pb2_module.endswith("_pb2"):
                        # Return *_pb2.Y
                        return cst.Attribute(value=cst.Name(pb2_module), attr=annotation.attr)

    # Replace repositories.DB with DB
    if m.matches(annotation, m.Attribute(value=m.Name("repositories"), attr=m.Name("DB"))):
        return cst.Name("DB")

    return annotation


class AnnotationNormalizer(cst.CSTTransformer):
    """Normalize annotations in the tree."""

    def leave_Annotation(self, original_node: cst.Annotation, updated_node: cst.Annotation) -> cst.Annotation:
        """Normalize type annotations."""
        normalized = normalize_annotation(updated_node.annotation)
        if normalized != updated_node.annotation:
            return updated_node.with_changes(annotation=normalized)
        return updated_node


class ImplementationMethodAnnotator(cst.CSTTransformer):
    """Add type annotations to implementation methods."""

    def __init__(self, pyi_methods: dict[str, tuple[dict, cst.Annotation]]):
        super().__init__()
        self.pyi_methods = pyi_methods
        self.modified = False

    def leave_FunctionDef(self, original_node: cst.FunctionDef, updated_node: cst.FunctionDef) -> cst.FunctionDef:
        """Update function signatures with annotations from .pyi file."""
        method_name = updated_node.name.value

        if method_name not in self.pyi_methods:
            return updated_node

        params_types, return_type = self.pyi_methods[method_name]

        # Skip if method already has return type annotation
        if updated_node.returns is not None:
            return updated_node

        # Add return type annotation
        if return_type:
            updated_node = updated_node.with_changes(returns=return_type)
            self.modified = True

        # Update parameter annotations (add if missing)
        new_params = updated_node.params
        param_list = list(new_params.params)
        new_param_list = []

        for i, param in enumerate(param_list):
            param_name = param.name.value
            if param_name in params_types and param.annotation is None:
                new_param = param.with_changes(annotation=cst.Annotation(annotation=params_types[param_name]))
                new_param_list.append(new_param)
                self.modified = True
            else:
                new_param_list.append(param)

        if self.modified:
            new_params = new_params.with_changes(params=new_param_list)
            updated_node = updated_node.with_changes(params=new_params)

        return updated_node


def get_matching_pyi_file(servicer_file: Path, proto_dir: Path) -> Path | None:
    """Find matching .pyi file for a servicer implementation."""
    # Extract the base name without extension
    # e.g., "account.py" -> look for "account_pb2_grpc.pyi"
    base_name = servicer_file.stem  # e.g., "account"

    pyi_file = proto_dir / f"{base_name}_pb2_grpc.pyi"
    if pyi_file.exists():
        return pyi_file

    return None


def ensure_imports(tree: cst.Module) -> cst.Module:
    """Ensure required imports are present in the module."""
    # Collect all types used in annotations
    collector = AnnotationCollector()
    tree.visit(collector)
    types_used = collector.types_used

    # Get existing imports
    existing_imports = set()
    existing_modules = set()

    for node in tree.body:
        # Check if it's a SimpleStatementLine containing an ImportFrom
        import_stmt = None
        if isinstance(node, cst.SimpleStatementLine):
            for stmt in node.body:
                if isinstance(stmt, cst.ImportFrom):
                    import_stmt = stmt
                    break
        elif isinstance(node, cst.ImportFrom):
            import_stmt = node
        elif isinstance(node, cst.SimpleStatementLine):
            for stmt in node.body:
                if isinstance(stmt, cst.Import):
                    # Handle "import foo"
                    import_stmt = stmt

        if not import_stmt:
            continue

        # Handle "from X import Y"
        if isinstance(import_stmt, cst.ImportFrom):
            # Check the module being imported from
            if isinstance(import_stmt.module, cst.Attribute):
                module_name = _get_full_name(import_stmt.module)
            elif isinstance(import_stmt.module, cst.Name):
                module_name = import_stmt.module.value
            else:
                module_name = None

            if module_name:
                existing_modules.add(module_name)

            # Get imported names
            if isinstance(import_stmt.names, cst.ImportStar):
                existing_imports.add("*")
            elif isinstance(import_stmt.names, (list, tuple)):
                for name in import_stmt.names:
                    if isinstance(name, cst.ImportAlias):
                        name_str = name.name.value if isinstance(name.name, cst.Name) else _get_full_name(name.name)
                        existing_imports.add(name_str)
            elif isinstance(import_stmt.names, cst.ImportAlias):
                name_str = (
                    import_stmt.names.name.value
                    if isinstance(import_stmt.names.name, cst.Name)
                    else _get_full_name(import_stmt.names.name)
                )
                existing_imports.add(name_str)

    # Determine what imports are needed based on types used
    missing_imports = []

    # Map of type name to import statement
    import_map = {
        "DB": "from couchers.repositories import DB",
        "CouchersContext": "from couchers.context import CouchersContext",
        "Awaitable": "from collections.abc import Awaitable",
        "List": "from typing import List",
        "Dict": "from typing import Dict",
        "Tuple": "from typing import Tuple",
        "Optional": "from typing import Optional",
        "Union": "from typing import Union",
        "Callable": "from typing import Callable",
        "empty_pb2": "from google.protobuf import empty_pb2",
        "httpbody_pb2": "from couchers.proto.google.api import httpbody_pb2",
    }

    for type_name in types_used:
        if type_name in import_map:
            import_stmt = import_map[type_name]
            if type_name not in existing_imports:
                if import_stmt not in missing_imports:
                    missing_imports.append(import_stmt)
        elif type_name.endswith("_pb2"):
            # Proto imports - check if this specific type is imported
            if type_name not in existing_imports:
                # Try to import from couchers.proto first
                import_stmt = f"from couchers.proto import {type_name}"
                if import_stmt not in missing_imports:
                    missing_imports.append(import_stmt)

    if not missing_imports:
        return tree

    # Parse the import statements
    new_imports = []
    for import_stmt in missing_imports:
        import_tree = cst.parse_statement(import_stmt)
        new_imports.append(import_tree)

    # Insert imports at the beginning (after any module docstring/comments)
    body_list = list(tree.body)
    insert_idx = 0

    # Skip module docstring if present
    if body_list and isinstance(body_list[0], cst.SimpleStatementLine):
        first_stmt = body_list[0]
        if isinstance(first_stmt.body[0], cst.Expr) and isinstance(
            first_stmt.body[0].value, (cst.SimpleString, cst.ConcatenatedString)
        ):
            insert_idx = 1

    # Insert new imports
    for new_import in reversed(new_imports):
        body_list.insert(insert_idx, new_import)

    return tree.with_changes(body=body_list)


def _get_full_name(node: cst.BaseExpression) -> str:
    """Get the full dotted name from an attribute/name node."""
    if isinstance(node, cst.Name):
        return node.value
    elif isinstance(node, cst.Attribute):
        return _get_full_name(node.value) + "." + node.attr.value
    else:
        return str(node)


class AnnotationCollector(cst.CSTVisitor):
    """Collect all types used in annotations."""

    def __init__(self):
        super().__init__()
        self.types_used = set()  # Set of root module names used

    def visit_Annotation(self, node: cst.Annotation) -> None:
        """Extract type names from annotations."""
        annotation = node.annotation
        if isinstance(annotation, cst.Name):
            self.types_used.add(annotation.value)
        elif isinstance(annotation, cst.Attribute):
            # Get the root name, e.g., "account_pb2" from "account_pb2.GetAccountInfoRes"
            root = annotation
            while isinstance(root, cst.Attribute):
                root = root.value
            if isinstance(root, cst.Name):
                self.types_used.add(root.value)
        elif isinstance(annotation, cst.Subscript):
            # Handle generic types like List[Something], Dict[Key, Value], etc.
            if isinstance(annotation.value, cst.Name):
                self.types_used.add(annotation.value.value)
            elif isinstance(annotation.value, cst.Attribute):
                root = annotation.value
                while isinstance(root, cst.Attribute):
                    root = root.value
                if isinstance(root, cst.Name):
                    self.types_used.add(root.value)


def process_servicer_file(servicer_file: Path, pyi_file: Path) -> bool:
    """Apply annotations from .pyi file to servicer implementation."""
    try:
        # Read implementation file
        with open(servicer_file) as f:
            impl_code = f.read()

        impl_tree = cst.parse_module(impl_code)

        # Get method signatures from .pyi file
        pyi_methods = get_pyi_methods(pyi_file)

        # Apply annotations (if there are any to apply)
        annotator = ImplementationMethodAnnotator(pyi_methods)
        modified_tree = impl_tree.visit(annotator)

        # Always normalize annotations (both new and existing)
        normalizer = AnnotationNormalizer()
        normalized_tree = modified_tree.visit(normalizer)
        annotations_normalized = normalized_tree.code != modified_tree.code

        # Always ensure imports are present (for both new and existing annotations)
        modified_tree_with_imports = ensure_imports(normalized_tree)
        imports_were_added = modified_tree_with_imports.code != normalized_tree.code

        if annotator.modified or annotations_normalized or imports_were_added:
            # Write back to file
            with open(servicer_file, "w") as f:
                f.write(modified_tree_with_imports.code)

            changes = []
            if annotator.modified:
                changes.append("annotations")
            if annotations_normalized:
                changes.append("normalized")
            if imports_were_added:
                changes.append("imports")
            change_desc = ", ".join(changes)
            print(f"✓ Updated {servicer_file.name} ({change_desc})")
            return True
        else:
            print(f"- No changes needed for {servicer_file.name}")
            return False

    except Exception as e:
        print(f"✗ Error processing {servicer_file.name}: {e}", file=sys.stderr)
        return False


def main():
    """Main entry point."""
    backend_dir = Path(__file__).parent
    proto_dir = backend_dir / "src/couchers/proto"
    servicers_dir = backend_dir / "src/couchers/servicers"

    # Find all servicer .py files
    servicer_files = sorted([f for f in servicers_dir.glob("*.py") if f.name != "__init__.py"])

    if not servicer_files:
        print("No servicer files found!")
        return 1

    print(f"Found {len(servicer_files)} servicer files")

    updated_count = 0
    for servicer_file in servicer_files:
        pyi_file = get_matching_pyi_file(servicer_file, proto_dir)

        if not pyi_file:
            print(f"- No .pyi file found for {servicer_file.name}")
            continue

        if process_servicer_file(servicer_file, pyi_file):
            updated_count += 1

    print(f"\nUpdated {updated_count} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
