#!/usr/bin/env python3
"""
Frontend pre-deployment checklist.
Run from repo root or from within `frontend/`.
"""
from __future__ import annotations

import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent  # .../frontend


def _exists(relpath: str) -> bool:
    return (HERE / relpath).exists()


print("TRAINPI FRONTEND DEPLOYMENT CHECKLIST")
print("=" * 60)

checks: list[tuple[str, bool, bool]] = []

# (label, ok, required)
checks.extend(
    [
        ("package.json exists", _exists("package.json"), True),
        ("next.config.js exists", _exists("next.config.js"), True),
        ("tsconfig.json exists", _exists("tsconfig.json"), True),
        ("vercel.json exists", _exists("vercel.json"), False),
        (".env.local exists (optional)", _exists(".env.local"), False),
    ]
)

all_required_ok = True
for label, ok, required in checks:
    if ok:
        status = "PASS"
    else:
        status = "MISSING"
        if required:
            all_required_ok = False
    print(f"- {label:.<38} {status}")

print("=" * 60)
if all_required_ok:
    print("OK: frontend looks ready.")
    sys.exit(0)
else:
    print("ERROR: required frontend items missing.")
    sys.exit(1)

