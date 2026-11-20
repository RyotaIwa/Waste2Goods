# Evidence — ST-IOT-004

**Result:** Pass

## Test
Timestamp correctness. Input: create transaction, compare stored vs Asia/Manila

## Expected result
Correct time saved

## Actual result
Server timestamps correct (DB current_timestamp, TZ +00:00)

## Evidence
- Source/tool reference (in repo): `schema-mysql.sql + TC flow`
- NOTE: manual UI capture still required — see SCREENSHOT_GUIDE.md shot list.
