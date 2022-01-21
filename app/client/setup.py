import setuptools

with open("README.md") as f:
    long_description = f.read()

with open("src/couchers/version") as f:
    version = f.read().strip()

setuptools.setup(
    name="couchers",
    version=version,
    author="Couchers, Inc. and Contributors",
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
    package_data={"couchers": ["version"]},
    python_requires=">=3.8",
    install_requires=["grpcio", "protobuf"],
)
