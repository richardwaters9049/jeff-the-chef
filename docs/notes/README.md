<!-- Explains the educational encrypted-notes workflow and its security limitations. -->

# Encrypted notes practice

The files in this folder exercise authenticated encryption with AES-256-GCM and
a key derived from a passphrase using scrypt. This is a learning exercise, not a
secret-management system.

The committed examples use this deliberately public practice passphrase:

```text
chef-jeff-practice-only
```

Encrypt a note:

```bash
NOTES_PASSPHRASE='chef-jeff-practice-only' \
  bun scripts/notes-crypto.mjs encrypt \
  docs/notes/test-notes.md docs/notes/test-notes.md.enc
```

Decrypt it:

```bash
NOTES_PASSPHRASE='chef-jeff-practice-only' \
  bun scripts/notes-crypto.mjs decrypt \
  docs/notes/test-notes.md.enc /tmp/test-notes.decrypted.md
```

For genuinely private notes, use a strong uncommitted passphrase, commit only
the `.enc` file, securely remove the plaintext, and keep the passphrase in a
password manager. Git history can retain files even after they are deleted.
