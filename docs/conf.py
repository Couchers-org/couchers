project = "Couchers.org Docs"
copyright = "2024, Couchers, Inc. and Contributors"
author = "Couchers, Inc. and Contributors"

extensions = [
    "myst_parser",
    "sphinx_copybutton",
    "sphinxext.opengraph",
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "venv", "Thumbs.db", ".DS_Store"]

html_title = "Couchers.org Docs"
html_favicon = "_static/favicon.ico"
html_theme = "furo"
html_static_path = ["_static"]
html_logo = "_static/logo512.png"

html_theme_options: Dict[str, Any] = {
    "source_repository": "https://github.com/Couchers-org/couchers/",
    "source_branch": "develop",
    "source_directory": "docs/",
    "dark_css_variables": {
        "font-stack": '"Ubuntu", sans-serif',
        "font-stack--monospace": '"Source Code Pro", monospace',
        "color-brand-primary": "#e47701",
        "color-brand-content": "#e47701",
    },
    "light_css_variables": {
        "font-stack": '"Ubuntu", sans-serif',
        "font-stack--monospace": '"Source Code Pro", monospace',
        "color-brand-primary": "#e47701",
        "color-brand-content": "#e47701",
    },
}

html_css_files = [
    "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap",
]
