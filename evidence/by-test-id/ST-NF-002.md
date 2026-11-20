# Evidence — ST-NF-002

**Result:** Pass

## Test
Logout and session
Input: Log out, then press the browser Back button

## Expected result
Private pages cannot be seen

## Actual result
Pass. JWT lives in memory; logout clears state; pressing browser Back button redirects to login, preventing private dashboard viewing.

## Evidence
- Source/tool reference (in repo): `ST-NF-002.png`
- NOTE: manual UI capture still required — see SCREENSHOT_GUIDE.md shot list.
