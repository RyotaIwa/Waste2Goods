# Evidence — ST-NF-005

**Result:** Pass

## Test
Brute-force lockout. Input: 6x wrong password on one account

## Expected result
Account locked (429) after threshold

## Actual result
Attempt 6 -> 429, locked 5 minutes

## Evidence
- Screenshot: `evidence\screenshots\ST-NF-005-brute-force-lockout.png`
- Source/tool reference (in repo): `RUBRIC_STEP_BY_STEP.md 4.1 + rate-limit.js`
