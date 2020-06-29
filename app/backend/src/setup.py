#!/usr/bin/env python3

# This file exists only for testing!

from setuptools import setup, find_packages

setup(
    name="couchers",
    packages=find_packages("src/"),
    install_requires=["pytest"]
)
