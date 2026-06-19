// Encrypts or decrypts project notes with scrypt-derived AES-256-GCM keys for practice.
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const MAGIC = Buffer.from('JTCNOTE1');
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function usage() {
  console.error(
    'Usage: NOTES_PASSPHRASE="..." bun scripts/notes-crypto.mjs <encrypt|decrypt> <input> <output>',
  );
  process.exitCode = 1;
}

function keyFrom(passphrase, salt) {
  return scryptSync(passphrase, salt, 32);
}

async function encrypt(inputPath, outputPath, passphrase) {
  const plaintext = await readFile(inputPath);
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(passphrase, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  await writeFile(
    outputPath,
    Buffer.concat([MAGIC, salt, iv, tag, ciphertext]),
    {
      mode: 0o600,
    },
  );
}

async function decrypt(inputPath, outputPath, passphrase) {
  const payload = await readFile(inputPath);
  if (!payload.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('This is not a Jeff encrypted-notes file.');
  }
  let offset = MAGIC.length;
  const salt = payload.subarray(offset, (offset += SALT_LENGTH));
  const iv = payload.subarray(offset, (offset += IV_LENGTH));
  const tag = payload.subarray(offset, (offset += TAG_LENGTH));
  const ciphertext = payload.subarray(offset);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyFrom(passphrase, salt),
    iv,
  );
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  await writeFile(outputPath, plaintext, { mode: 0o600 });
}

const [operation, inputPath, outputPath] = process.argv.slice(2);
const passphrase = process.env.NOTES_PASSPHRASE;

if (
  !passphrase ||
  !inputPath ||
  !outputPath ||
  !['encrypt', 'decrypt'].includes(operation)
) {
  usage();
} else {
  try {
    if (operation === 'encrypt') {
      await encrypt(inputPath, outputPath, passphrase);
    } else {
      await decrypt(inputPath, outputPath, passphrase);
    }
    console.log(`${operation} complete: ${outputPath}`);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Encryption failed.',
    );
    process.exitCode = 1;
  }
}
