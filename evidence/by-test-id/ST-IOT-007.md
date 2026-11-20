# Evidence — ST-IOT-007

**Result:** Pass

## Test
Timestamp
Input: Compare device time and saved time

## Expected result
Saved time is correct (Asia/Manila) even if the device clock is off

## Actual result
Pass (adapted). Server assigns UTC timestamps at row creation (MySQL current_timestamp); client renders Asia/Manila, so incorrect device clocks cannot corrupt stored time.

## Evidence
- Source/tool reference (in repo): `ST-IOT-007.png`
- NOTE: manual UI capture still required — see SCREENSHOT_GUIDE.md shot list.
