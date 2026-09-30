#!/usr/bin/env python3
"""Check the static publishing directory with Python's standard library."""

from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "website"
MAX_BYTES = 100 * 1024 * 1024
errors = []
referenced = set()
positions = set()
collection_keys = set()


def problem(source, message):
    errors.append(f"{source.relative_to(ROOT)}: {message}")


def check_url(source, value):
    """Resolve a browser URL relative to its document, preserving subpath safety."""
    url = urlsplit(value.strip())
    if url.scheme or url.netloc or not url.path:
        return
    if url.path.startswith("/"):
        problem(source, f"root-relative URL breaks project Pages paths: {value}")
        return
    target = (source.parent / unquote(url.path)).resolve()
    if not target.is_relative_to(SITE):
        problem(source, f"URL escapes website/: {value}")
        return
    if target.is_dir():
        target /= "index.html"
    referenced.add(target)
    if not target.is_file():
        problem(source, f"missing local resource: {value}")


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.source = source

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if value is None:
                continue
            if key in {"href", "src", "poster"}:
                check_url(self.source, value)
            elif key == "data-position":
                positions.add(value)
            elif key == "data-collection":
                collection_keys.add(value)


if not (SITE / "index.html").is_file():
    sys.exit("Missing website/index.html")

files = sorted(SITE.rglob("*"))
for path in files:
    if path.is_symlink():
        problem(path, "symbolic links are not valid Pages artifacts")
    if any(part in {".git", ".openai", ".codex", "__pycache__"} for part in path.relative_to(SITE).parts):
        problem(path, "local configuration or cache must not be published")
    if not path.is_file():
        continue
    if path.stat().st_size > MAX_BYTES:
        problem(path, "file exceeds GitHub's 100 MiB limit")
    with path.open("rb") as stream:
        if stream.read(80).startswith(b"version https://git-lfs.github.com/spec/v1"):
            problem(path, "Git LFS pointer found instead of a publishable asset")
    if path.suffix.lower() == ".html":
        Page(path).feed(path.read_text(encoding="utf-8"))

# Check literal JS asset URLs and the task templates used by this site.
for path in files:
    if path.suffix.lower() == ".js" and path.is_file():
        source = path.read_text(encoding="utf-8")
        for match in re.finditer(r"(['\"`])((?:\./)?assets/[^'\"`\n]+)\1", source):
            value = match.group(2)
            if "${" not in value:
                check_url(path, value)
            elif "${key}" in value and value.count("${") == 1:
                for key in collection_keys:
                    check_url(path, value.replace("${key}", key))
            elif "${position}" in value and "${method}" in value and value.count("${") == 2:
                for position in positions:
                    for method in ("bc", "hgd", "rgd"):
                        check_url(path, value.replace("${position}", position).replace("${method}", method))
            else:
                problem(path, f"unsupported dynamic asset URL; extend checker: {value}")
    elif path.suffix.lower() == ".css" and path.is_file():
        for match in re.finditer(r"url\(\s*['\"]?([^)'\"]+)['\"]?\s*\)", path.read_text(encoding="utf-8")):
            check_url(path, match.group(1))

for path in files:
    if path.suffix.lower() == ".pdf" and path.resolve() not in referenced:
        problem(path, "unused PDF must be removed from the publishing directory")

if errors:
    print("Static site check failed:\n" + "\n".join(f"- {error}" for error in errors), file=sys.stderr)
    sys.exit(1)

assets = [path for path in files if path.is_file()]
total_mib = sum(path.stat().st_size for path in assets) / 1024**2
print(f"Static site OK: {len(assets)} files, {len(referenced)} local resources, {len(positions)} evaluation positions, {len(collection_keys)} collection recordings, {total_mib:.1f} MiB.")
