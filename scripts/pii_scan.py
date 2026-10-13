#!/usr/bin/env python3

import re
import sys
from pathlib import Path


PATTERNS = {
    "email address": re.compile(
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE
    ),
    "US Social Security number": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "US phone number": re.compile(
        r"(?<!\d)(?:\+1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]\d{3}[-.\s]\d{4}(?!\d)"
    ),
}

TEXT_EXTENSIONS = {".csv", ".json", ".md", ".txt", ".tsv"}


def candidate_files(paths: list[str]):
    for raw_path in paths:
        path = Path(raw_path)
        if path.is_file() and path.suffix.lower() in TEXT_EXTENSIONS:
            yield path
        elif path.is_dir():
            for child in path.rglob("*"):
                if child.is_file() and child.suffix.lower() in TEXT_EXTENSIONS:
                    yield child


def main() -> int:
    scan_paths = sys.argv[1:] or ["data"]
    findings = 0

    for path in sorted(set(candidate_files(scan_paths))):
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            continue

        for line_number, line in enumerate(lines, start=1):
            for label, pattern in PATTERNS.items():
                if pattern.search(line):
                    findings += 1
                    print(
                        f"::error file={path},line={line_number},"
                        f"title=PII detected::{label} detected; remove, mask, "
                        "or replace it with a non-identifying customer ID."
                    )

    if findings:
        print(f"\nPII scan failed with {findings} finding(s). Values were not printed.")
        return 1

    print("PII scan passed: no configured PII patterns were detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
