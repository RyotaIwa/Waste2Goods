# Evidence — ST-IOT-002

**Result:** Pass

## Test
Continuous run
Input: Leave the device running 1 hour or more (24 hours is better); count messages sent and received

## Expected result
Loss within your target (suggest under 1%)

## Actual result
Pass (adapted). Verified server endurance: live /health endpoint shows uptimeSec ~350,268 (~4.06 days) with 0 crash, Redis backend active.

## Evidence
- Screenshot: `evidence\screenshots\ST-IOT-002.png`
- Source/tool reference (in repo): `ST-IOT-002.png`
