# Evidence — ST-NF-001

**Result:** Pass

## Test
Only the right role gets in
Input: Log in as a normal user and type the admin page address

## Expected result
Access denied

## Actual result
Pass. Verified on LIVE server: resident token accessing /api/security/policy or /admin returns HTTP 403 Forbidden; UI redirects to login/home.

## Evidence
- Source/tool reference (in repo): `ST-NF-001.png`
- NOTE: manual UI capture still required — see SCREENSHOT_GUIDE.md shot list.
