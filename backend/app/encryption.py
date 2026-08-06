"""
Application-level encryption at rest for sensitive free-text columns —
resume text and uploaded organizational document text, which can contain
PII and confidential SOPs/mission details (Exhibit A's "confidentiality of
uploaded organizational documents" requirement).

Uses Fernet (AES-128-CBC + HMAC, authenticated) from `cryptography`, already
a transitive dependency via python-jose[cryptography] — no new package.

Gated behind ENCRYPTION_KEY like the rest of this app's optional
infrastructure (Redis, Sentry, R2): unset in dev, the column stores
plaintext exactly as before; set it, and new/updated rows are encrypted
transparently via the EncryptedText SQLAlchemy type below. Existing
plaintext rows are read back as-is (see EncryptedText.process_result_value)
so turning this on doesn't require a backfill migration to keep working —
only newly written data benefits until one is run.

Generate a key with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
import os
from sqlalchemy.types import TypeDecorator, Text

_ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "").strip()
_fernet = None


def is_encryption_configured() -> bool:
    return bool(_ENCRYPTION_KEY)


def _get_fernet():
    global _fernet
    if _fernet is None and _ENCRYPTION_KEY:
        from cryptography.fernet import Fernet
        _fernet = Fernet(_ENCRYPTION_KEY.encode())
    return _fernet


class EncryptedText(TypeDecorator):
    """A Text column that's encrypted at rest when ENCRYPTION_KEY is set,
    and a plain Text column otherwise. Application code never sees the
    difference — reads/writes go through as plain Python strings."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        fernet = _get_fernet()
        if fernet is None:
            return value
        return fernet.encrypt(value.encode("utf-8")).decode("ascii")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        fernet = _get_fernet()
        if fernet is None:
            return value
        try:
            return fernet.decrypt(value.encode("ascii")).decode("utf-8")
        except Exception:
            # Pre-encryption plaintext rows (written before ENCRYPTION_KEY was
            # set) aren't valid Fernet tokens — return them as-is rather than
            # raising, so enabling encryption doesn't break existing reads.
            return value
