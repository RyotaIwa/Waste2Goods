# Evidence — ST-NF-009

**Result:** Pass

## Test
(your own test)
Brute-force lockout + rate limiting
Input: 6x wrong password on one account

## Expected result
Account locked (429) after threshold; throttled per policy

## Actual result
Pass. 6 consecutive failed logins triggers HTTP 429 Too Many Requests with 5-minute lockout; Redis-backed tiered rate limiter active.

## Evidence
- Source/tool reference (in repo): `ST-NF-009.png`
- NOTE: manual UI capture still required — see SCREENSHOT_GUIDE.md shot list.
