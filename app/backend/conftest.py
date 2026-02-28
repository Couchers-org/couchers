import sys
from pathlib import Path

# Add src/ to the path so pytest can find the tests package when loading plugins
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Register the "pytest-split" plugin (vendored for pytest 9+ compatibility)
pytest_plugins = ["tests.pytest_split.plugin"]
