# Evidence — ST-NF-003

**Result:** Pass

## Test
Bad text in forms
Input: Type <script>alert(1)</script> and ' OR 1=1 -- in text fields

## Expected result
Treated as plain text or rejected; nothing runs; no database error shown

## Actual result
Pass. Unit test + LIVE test: script tags escaped to safe entities; parameterized SQL prevents injection; no SQL syntax error exposed.

## Evidence
- Source/tool reference (in repo): `ST-NF-003.png`
- Tool-report excerpt (`evidence/reports/`):
  ```
  # Subtest: XSS sanitization: escapeHtml neutralizes HTML/script injection payloads
  ```
