# Evidence — ST-NF-004

**Result:** Pass

## Test
Passwords and keys
Input: Check the database and code

## Expected result
Passwords hashed; no passwords or API keys in screenshots or the public repo

## Actual result
Pass. Database stores bcrypt password hashes ($2b$10$...); secrets isolated in git-ignored .env file; no plain text credentials in repo.

## Evidence
- Source/tool reference (in repo): `ST-NF-004.png`
- NOTE: manual UI capture still required — see SCREENSHOT_GUIDE.md shot list.
