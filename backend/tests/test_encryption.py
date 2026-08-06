"""
Encryption at rest for resume_text / parsed_text (app/encryption.py) —
gated behind ENCRYPTION_KEY like the rest of the app's optional
infrastructure. Verifies both states: unset (plaintext passthrough, the
current default) and set (real AES/Fernet encryption, ciphertext never
matches the plaintext, legacy plaintext rows still readable).
"""
import importlib
import os

import pytest
from cryptography.fernet import Fernet


@pytest.fixture()
def encryption_module_without_key(monkeypatch):
    monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
    import app.encryption as encryption
    importlib.reload(encryption)
    yield encryption
    importlib.reload(encryption)


@pytest.fixture()
def encryption_module_with_key(monkeypatch):
    monkeypatch.setenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
    import app.encryption as encryption
    importlib.reload(encryption)
    yield encryption
    monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
    importlib.reload(encryption)


def test_plaintext_passthrough_when_key_unset(encryption_module_without_key):
    encryption = encryption_module_without_key
    assert encryption.is_encryption_configured() is False

    et = encryption.EncryptedText()
    stored = et.process_bind_param("plain text value", None)
    assert stored == "plain text value"
    assert et.process_result_value(stored, None) == "plain text value"


def test_encrypts_and_decrypts_when_key_set(encryption_module_with_key):
    encryption = encryption_module_with_key
    assert encryption.is_encryption_configured() is True

    et = encryption.EncryptedText()
    plaintext = "Confidential SOP text with compliance policy CP-114"
    stored = et.process_bind_param(plaintext, None)

    assert stored != plaintext
    assert "Confidential" not in stored
    assert "CP-114" not in stored

    assert et.process_result_value(stored, None) == plaintext


def test_legacy_plaintext_rows_still_readable_after_key_enabled(encryption_module_with_key):
    """Rows written before ENCRYPTION_KEY was ever set aren't valid Fernet
    tokens — decrypting must fail closed to returning the raw value rather
    than raising, so turning encryption on doesn't break existing data."""
    encryption = encryption_module_with_key
    et = encryption.EncryptedText()

    legacy_value = "Text written back when there was no ENCRYPTION_KEY at all"
    assert et.process_result_value(legacy_value, None) == legacy_value


def test_none_passes_through_in_both_modes(encryption_module_without_key, encryption_module_with_key):
    for encryption in (encryption_module_without_key, encryption_module_with_key):
        et = encryption.EncryptedText()
        assert et.process_bind_param(None, None) is None
        assert et.process_result_value(None, None) is None
