#!/usr/bin/env python3
"""
Backend pre-deployment checklist.
Run from repo root or from within `backend/`.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent  # .../backend


def _exists(relpath: str) -> bool:
    return (HERE / relpath).exists()


def _env_has(key: str) -> bool:
    env_path = HERE / ".env"
    if not env_path.exists():
        return False
    try:
        return key in env_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return False


print("TRAINPI BACKEND DEPLOYMENT CHECKLIST")
print("=" * 60)

checks: list[tuple[str, bool, bool]] = []

# (label, ok, required)
checks.extend(
    [
        ("requirements.txt exists", _exists("requirements.txt"), True),
        ("run.py exists", _exists("run.py"), True),
        ("app/main.py exists", _exists("app/main.py"), True),
        ("alembic.ini exists", _exists("alembic.ini"), False),
        ("vercel.json exists", _exists("vercel.json"), False),
        (".env exists", _exists(".env"), True),
        ("DATABASE_URL set in .env", _env_has("DATABASE_URL"), True),
        ("SECRET_KEY set in .env", _env_has("SECRET_KEY"), True),
        ("GROQ_API_KEY set in .env", _env_has("GROQ_API_KEY"), False),
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
    print("OK: backend looks ready.")
    sys.exit(0)
else:
    print("ERROR: required backend items missing.")
    sys.exit(1)

