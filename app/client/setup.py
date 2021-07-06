import setuptools

long_description = """
# Couchers.org Python Client

The next-generation couch surfing platform. Free forever. Community‑led. Non‑profit. Modern. Read more about us at [Couchers.org](https://couchers.org).

This is the Couchers.org Python Client, mainly used for administrative purposes and the like.

Usage of the Couchers.org service provided by the Couchers.org Foundation is governed under our [Terms of Service](https://app.couchers.org/terms).
"""

setuptools.setup(
    name="couchers",
    version="0.0.11",
    author="Couchers.org Foundation and Contributors",
    author_email="support@couchers.org",
    description="Couchers.org: The next-generation couch surfing platform. Free forever. Community‑led. Non‑profit. Modern.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://couchers.org",
    project_urls={
        "GitHub": "https://github.com/Couchers-org/couchers",
        "Bug Tracker": "https://github.com/Couchers-org/couchers/issues",
        "Community Forum": "https://community.couchers.org",
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    package_dir={"": "src"},
    packages=setuptools.find_packages(where="src"),
    python_requires=">=3.8",
    install_requires=["grpcio", "protobuf"],
)
