---
title: "Your first chat with Claude"
source: "https://claude.ai/chat/b74d72b7-5fe9-4d16-86f7-f478f40af37e"
model: "claude-sonnet-5-5"
exported: 2026-11-20
---

# Human — Nov 20, 2026, 7:14 PM

**Attachment: training_a_bottle_detection_model.md · blob · 853.5 KB**

tail -n 3 .env | sed 's/=.*/=(hidden)/' 67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb how?

# Claude — Nov 20, 2026, 7:14 PM

That 64-character string is your machine key, and I think you pasted it here by mistake. Treat it as exposed and make a new one. The old key only matters once the deploy is done, so replacing it now costs nothing.

**1. Replace the key** (in the droplet, in `/home/deploy/waste2goods`)

```bash
KEY=$(openssl rand -hex 32)
sed -i "s/^MACHINE_API_KEY=.*/MACHINE_API_KEY=$KEY/" .env
echo "$KEY"
```

The first line makes the new key and the second swaps it into `.env`. The third prints it so you can copy it. Keep it in a password manager or a private note, not in chat.

**2. Check it was saved, with the value hidden**

```bash
tail -n 3 .env | sed 's/=.*/=(hidden)/'
```

How the check works: `tail -n 3 .env` takes the last 3 lines of the file, and `sed 's/=.*/=(hidden)/'` replaces everything after each `=` with `(hidden)`. It should print something like:

```
MACHINE_API_KEY=(hidden)
MACHINE_POINTS_PER_BOTTLE=(hidden)
```

If it shows both names, the key is saved.

**3. Give the machine the same key.** Put the new value in `trainmodel\.env` on your PC, because the machine and the server must match exactly.

If "how?" meant something else, like how to run these commands or why the check hides the values, tell me which part. Otherwise, once the check shows both lines, run Step 2 and Step 3 from my last message and send me the output.

# Human — Nov 20, 2026, 7:15 PM

no need to change hidden key

# Claude — Nov 20, 2026, 7:15 PM

Okay, keep the key as it is. The only thing to know is that anyone who has the key can send fake deposits to the machine API. If you ever want to swap it later, it's one `sed` command and a matching change in `trainmodel\.env`.

To continue, run these in the droplet, in `/home/deploy/waste2goods`:

```bash
grep -n "env_file\|KIOSK_PIN" docker-compose.yml
```

If it shows `env_file`, go straight to the deploy:

```bash
sudo -u deploy git pull
docker compose up -d --build
docker compose logs --tail=50 api
docker compose exec api printenv MACHINE_API_KEY | wc -c
```

The last command should print `65`, which means the key reached the container. Send me the output of the `grep` and of the deploy commands. If `KIOSK_PIN` shows up under `environment:`, send me that output first, with any real PIN or password values hidden, and I'll give you the exact lines to add.

# Human — Nov 20, 2026, 7:18 PM

root@ubuntu-s-1vcpu-2gb-sgp1:~# cd /home/deploy/waste2goods
root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# printf '\n' >> .env
KEY=$(openssl rand -hex 32)
echo "MACHINE_API_KEY=$KEY" >> .env
echo "MACHINE_POINTS_PER_BOTTLE=5" >> .env
echo "$KEY"
67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb
root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# tail -n 3 .env | sed 's/=.*/=(67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb)/'

MACHINE_API_KEY=(67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb)
MACHINE_POINTS_PER_BOTTLE=(67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb)
root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# grep -n "env_file\|KIOSK_PIN" docker-compose.yml
95:      KIOSK_PIN: ${KIOSK_PIN:-}
root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods#

# Claude — Nov 20, 2026, 7:18 PM

Your `.env` is fine. The `sed` you ran printed the key on every line, but the file itself has `MACHINE_POINTS_PER_BOTTLE=5`.

The `grep` shows no `env_file`, and `KIOSK_PIN` is listed under `environment:` on line 95. That means the container only gets variables that are listed by name, so the two new ones must be added to `docker-compose.yml`. Without that, the API wouldn't see the key.

**1. Back up the file and add the two lines after line 95**

```bash
cp docker-compose.yml docker-compose.yml.bak
sed -i '95a\      MACHINE_API_KEY: ${MACHINE_API_KEY:-}\n      MACHINE_POINTS_PER_BOTTLE: ${MACHINE_POINTS_PER_BOTTLE:-5}' docker-compose.yml
```

**2. Check that they landed in the right place**

```bash
sed -n '88,100p' docker-compose.yml
```

You should see `MACHINE_API_KEY` and `MACHINE_POINTS_PER_BOTTLE` directly under `KIOSK_PIN`, lined up with the other variables. Paste that output here before deploying. I want to confirm they're under the api service and the spacing matches, because YAML breaks if the indentation is off.

**3. Then deploy**

```bash
sudo -u deploy git pull
docker compose up -d --build
docker compose logs --tail=50 api
docker compose exec api printenv MACHINE_API_KEY | wc -c
```

If `git pull` refuses because of the local change to `docker-compose.yml`, send me the error and I'll give you the fix.

# Human — Nov 20, 2026, 7:26 PM

> **Attachment: attachment · txt · 35.5 KB**
>
> * Documentation:  https://help.ubuntu.com
>  * Management:     https://landscape.canonical.com
>  * Support:        https://ubuntu.com/pro
> 
>  System information as of Fri Nov 20 11:03:09 UTC 2026
> 
>   System load:  0.45               Processes:             126
>   Usage of /:   18.7% of 47.39GB   Users logged in:       1
>   Memory usage: 45%                IPv4 address for eth0: 129.212.239.28
>   Swap usage:   23%                IPv4 address for eth0: 10.15.0.5
> 
> Expanded Security Maintenance for Applications is not enabled.
> 
> 36 updates can be applied immediately.
> To see these additional updates run: apt list --upgradable
> 
> Enable ESM Apps to receive additional future security updates.
> See https://ubuntu.com/esm or run: sudo pro status
> 
> New release '26.04.1 LTS' available.
> Run 'do-release-upgrade' to upgrade to it.
> 
> 
> *** System restart required ***
> Last login: Fri Nov 20 10:47:56 2026 from 111.90.247.227
> root@ubuntu-s-1vcpu-2gb-sgp1:~# cd /home/deploy/waste2goods
> root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# printf '\n' >> .env
> KEY=$(openssl rand -hex 32)
> echo "MACHINE_API_KEY=$KEY" >> .env
> echo "MACHINE_POINTS_PER_BOTTLE=5" >> .env
> echo "$KEY"
> 67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb
> root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# tail -n 3 .env | sed 's/=.*/=(67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb)/'
> 
> MACHINE_API_KEY=(67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb)
> MACHINE_POINTS_PER_BOTTLE=(67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb)
> root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# grep -n "env_file\|KIOSK_PIN" docker-compose.yml
> 95:      KIOSK_PIN: ${KIOSK_PIN:-}
> root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# cp docker-compose.yml docker-compose.yml.bak
> sed -i '95a\      MACHINE_API_KEY: ${MACHINE_API_KEY:-}\n      MACHINE_POINTS_PER_BOTTLE: ${MACHINE_POINTS_PER_BOTTLE:-5}' docker-compose.yml
> root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# sed -n '88,100p' docker-compose.yml
> 
>       # Demo accounts — keep SEED_DEMO_DATA=false on a public deployment
>       SEED_DEMO_DATA: ${SEED_DEMO_DATA:-false}
>       ADMIN_EMAIL: ${ADMIN_EMAIL:-admin@waste2goods.ph}
>       ADMIN_PASSWORD: ${ADMIN_PASSWORD:-}
>       RESIDENT_EMAIL: ${RESIDENT_EMAIL:-resident@cabantian.ph}
>       RESIDENT_PASSWORD: ${RESIDENT_PASSWORD:-}
>       KIOSK_PIN: ${KIOSK_PIN:-}
>       MACHINE_API_KEY: ${MACHINE_API_KEY:-}
>       MACHINE_POINTS_PER_BOTTLE: ${MACHINE_POINTS_PER_BOTTLE:-5}
> 
>       # Edge / platform
>       TRUST_PROXY: ${TRUST_PROXY:-1}
> root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# sudo -u deploy git pull
> docker compose up -d --build
> docker compose logs --tail=50 api
> docker compose exec api printenv MACHINE_API_KEY | wc -c
> remote: Enumerating objects: 128, done.
> remote: Counting objects: 100% (128/128), done.
> remote: Compressing objects: 100% (106/106), done.
> remote: Total 119 (delta 13), reused 119 (delta 13), pack-reused 0 (from 0)
> Receiving objects: 100% (119/119), 4.36 MiB | 10.01 MiB/s, done.
> Resolving deltas: 100% (13/13), completed with 8 local objects.
> From https://github.com/RyotaIwa/Waste2Goods
>    4e2f06f..9bf3587  main       -> origin/main
> Updating 4e2f06f..9bf3587
> Fast-forward
>  LIVE_TESTING_GUIDE.md                                   | 287 +++++++++++++++++++++++++++++++++++++++++++++++++++++
>  PRE-UAT_Testing_Guide_Waste2Goods.md                    |  90 +++++++++++++++++
>  System Testing_Pre-UAT Testing Submission Form.docx.pdf | Bin 0 -> 353646 bytes
>  Team2_Waste2Goods_Testing.zip                           | Bin 0 -> 2853840 bytes
>  evidence/SCREENSHOT_GUIDE.md                            | 212 +++++++++++++++++++++++++++++++++++++++
>  evidence/WHAT_TO_SCREENSHOT.md                          |  89 +++++++++++++++++
>  evidence/by-test-id/IT-001.md                           |  16 +++
>  evidence/by-test-id/IT-002.md                           |  16 +++
>  evidence/by-test-id/IT-003.md                           |  19 ++++
>  evidence/by-test-id/IT-004.md                           |  16 +++
>  evidence/by-test-id/IT-005.md                           |  19 ++++
>  evidence/by-test-id/IT-006.md                           |  17 ++++
>  evidence/by-test-id/IT-007.md                           |  16 +++
>  evidence/by-test-id/IT-008.md                           |  16 +++
>  evidence/by-test-id/IT-009.md                           |  16 +++
>  evidence/by-test-id/IT-010.md                           |  17 ++++
>  evidence/by-test-id/IT-011.md                           |  18 ++++
>  evidence/by-test-id/IT-012.md                           |  18 ++++
>  evidence/by-test-id/PT-001.md                           |  16 +++
>  evidence/by-test-id/PT-002.md                           |  16 +++
>  evidence/by-test-id/PT-003.md                           |  16 +++
>  evidence/by-test-id/PT-004.md                           |  15 +++
>  evidence/by-test-id/PT-005.md                           |  16 +++
>  evidence/by-test-id/PT-007.md                           |  16 +++
>  evidence/by-test-id/PT-008.md                           |  16 +++
>  evidence/by-test-id/PT-009.md                           |  17 ++++
>  evidence/by-test-id/ST-F-001.md                         |  17 ++++
>  evidence/by-test-id/ST-F-002.md                         |  17 ++++
>  evidence/by-test-id/ST-F-003.md                         |  17 ++++
>  evidence/by-test-id/ST-F-004.md                         |  17 ++++
>  evidence/by-test-id/ST-F-005.md                         |  16 +++
>  evidence/by-test-id/ST-F-006.md                         |  17 ++++
>  evidence/by-test-id/ST-F-007.md                         |  17 ++++
>  evidence/by-test-id/ST-F-008.md                         |  19 ++++
>  evidence/by-test-id/ST-F-009.md                         |  18 ++++
>  evidence/by-test-id/ST-F-010.md                         |  18 ++++
>  evidence/by-test-id/ST-IOT-002.md                       |  17 ++++
>  evidence/by-test-id/ST-IOT-003.md                       |  16 +++
>  evidence/by-test-id/ST-IOT-004.md                       |  16 +++
>  evidence/by-test-id/ST-IOT-007.md                       |  17 ++++
>  evidence/by-test-id/ST-IOT-008.md                       |  18 ++++
>  evidence/by-test-id/ST-NF-001.md                        |  17 ++++
>  evidence/by-test-id/ST-NF-002.md                        |  17 ++++
>  evidence/by-test-id/ST-NF-003.md                        |  20 ++++
>  evidence/by-test-id/ST-NF-004.md                        |  17 ++++
>  evidence/by-test-id/ST-NF-005.md                        |  16 +++
>  evidence/by-test-id/ST-NF-006.md                        |  17 ++++
>  evidence/by-test-id/ST-NF-007.md                        |  17 ++++
>  evidence/by-test-id/ST-NF-008.md                        |  17 ++++
>  evidence/by-test-id/ST-NF-009.md                        |  18 ++++
>  evidence/by-test-id/UT-001.md                           |  19 ++++
>  evidence/by-test-id/UT-002.md                           |  16 +++
>  evidence/by-test-id/UT-003.md                           |  19 ++++
>  evidence/by-test-id/UT-004.md                           |  19 ++++
>  evidence/by-test-id/UT-005.md                           |  19 ++++
>  evidence/by-test-id/UT-006.md                           |  16 +++
>  evidence/by-test-id/UT-007.md                           |  19 ++++
>  evidence/by-test-id/UT-008.md                           |  19 ++++
>  evidence/by-test-id/UT-009.md                           |  19 ++++
>  evidence/by-test-id/UT-010.md                           |  19 ++++
>  evidence/by-test-id/UT-011.md                           |  20 ++++
>  evidence/by-test-id/UT-012.md                           |  17 ++++
>  evidence/by-test-id/UT-013.md                           |  17 ++++
>  evidence/by-test-id/UT-014.md                           |  21 ++++
>  evidence/by-test-id/UT-015.md                           |  21 ++++
>  evidence/by-test-id/_INDEX.txt                          |  38 +++++++
>  evidence/capture_api_evidence.mjs                       |  90 +++++++++++++++++
>  evidence/capture_batch_live.mjs                         | 116 ++++++++++++++++++++++
>  evidence/capture_evidence.mjs                           | 114 +++++++++++++++++++++
>  evidence/capture_live.mjs                               |  65 ++++++++++++
>  evidence/capture_live_admin.mjs                         |  38 +++++++
>  evidence/generate_evidence.py                           | 137 ++++++++++++++++++++++++++
>  evidence/make_submission_zip.ps1                        |  46 +++++++++
>  evidence/render_perf_shots.mjs                          |  75 ++++++++++++++
>  evidence/reports/api-evidence.txt                       |  41 ++++++++
>  evidence/reports/coverage.txt                           |  94 ++++++++++++++++++
>  evidence/reports/e2e-output.txt                         | Bin 0 -> 1678 bytes
>  evidence/reports/live-api-evidence.txt                  |  22 +++++
>  evidence/reports/live-auth-tests.txt                    |  18 ++++
>  evidence/reports/live-form-tests.txt                    |  27 +++++
>  evidence/reports/perf_table.html                        |  46 +++++++++
>  evidence/reports/performance-benchmark.txt              |  15 +++
>  evidence/reports/unit-test-output.txt                   |  79 +++++++++++++++
>  evidence/screenshots/A-dashboard-live.png               | Bin 0 -> 274542 bytes
>  evidence/screenshots/A-live-admin.png                   | Bin 0 -> 73472 bytes
>  evidence/screenshots/A-live-health.png                  | Bin 0 -> 9994 bytes
>  evidence/screenshots/E-load.png                         | Bin 0 -> 60802 bytes
>  evidence/screenshots/IT-012.png                         | Bin 0 -> 26531 bytes
>  evidence/screenshots/PT-001.png                         | Bin 0 -> 60802 bytes
>  evidence/screenshots/PT-002.png                         | Bin 0 -> 60802 bytes
>  evidence/screenshots/PT-003.png                         | Bin 0 -> 60802 bytes
>  evidence/screenshots/PT-004.png                         | Bin 0 -> 60802 bytes
>  evidence/screenshots/PT-005.png                         | Bin 0 -> 60802 bytes
>  evidence/screenshots/PT-007.png                         | Bin 0 -> 60802 bytes
>  evidence/screenshots/PT-008.png                         | Bin 0 -> 60802 bytes
>  evidence/screenshots/PT-009.png                         | Bin 0 -> 9489 bytes
>  evidence/screenshots/ST-F-001-admin-dashboard.png       | Bin 0 -> 155812 bytes
>  evidence/screenshots/ST-F-001.png                       | Bin 0 -> 155812 bytes
>  evidence/screenshots/ST-F-001a-login-screen.png         | Bin 0 -> 47399 bytes
>  evidence/screenshots/ST-F-002-mobile-home.png           | Bin 0 -> 66962 bytes
>  evidence/screenshots/ST-F-002.png                       | Bin 0 -> 66962 bytes
>  evidence/screenshots/ST-F-005-admin-analytics.png       | Bin 0 -> 155812 bytes
>  evidence/screenshots/ST-F-005.png                       | Bin 0 -> 155812 bytes
>  evidence/screenshots/ST-IOT-002.png                     | Bin 0 -> 69953 bytes
>  evidence/screenshots/ST-IOT-003-kiosk-scan.png          | Bin 0 -> 318006 bytes
>  evidence/screenshots/ST-IOT-003.png                     | Bin 0 -> 318006 bytes
>  evidence/screenshots/ST-NF-005-brute-force-lockout.png  | Bin 0 -> 59668 bytes
>  evidence/screenshots/ST-NF-005.png                      | Bin 0 -> 59668 bytes
>  evidence/screenshots/ST-NF-006.png                      | Bin 0 -> 243034 bytes
>  evidence/screenshots/ST-NF-007.png                      | Bin 0 -> 57844 bytes
>  evidence/screenshots/UT-006-wrong-password.png          | Bin 0 -> 56751 bytes
>  evidence/screenshots/UT-006.png                         | Bin 0 -> 56751 bytes
>  evidence/test_live_auth.mjs                             | 111 +++++++++++++++++++++
>  evidence/test_live_form.mjs                             | 112 +++++++++++++++++++++
>  fill_form.py                                            | 611 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 
>  package-lock.json                                       |  30 ++++++
>  package.json                                            |   1 +
>  packages/backend/database/schema-mysql.sql              |  40 ++++++++
>  packages/backend/src/index-mysql.js                     |  24 ++---
>  packages/backend/src/machine-routes.js                  | 248 ++++++++++++++++++++++++++++++++++++++++++++++
>  run-tests.cmd                                           |  36 +++++++
>  121 files changed, 3966 insertions(+), 11 deletions(-)
>  create mode 100644 LIVE_TESTING_GUIDE.md
>  create mode 100644 PRE-UAT_Testing_Guide_Waste2Goods.md
>  create mode 100644 System Testing_Pre-UAT Testing Submission Form.docx.pdf
>  create mode 100644 Team2_Waste2Goods_Testing.zip
>  create mode 100644 evidence/SCREENSHOT_GUIDE.md
>  create mode 100644 evidence/WHAT_TO_SCREENSHOT.md
>  create mode 100644 evidence/by-test-id/IT-001.md
>  create mode 100644 evidence/by-test-id/IT-002.md
>  create mode 100644 evidence/by-test-id/IT-003.md
>  create mode 100644 evidence/by-test-id/IT-004.md
>  create mode 100644 evidence/by-test-id/IT-005.md
>  create mode 100644 evidence/by-test-id/IT-006.md
>  create mode 100644 evidence/by-test-id/IT-007.md
>  create mode 100644 evidence/by-test-id/IT-008.md
>  create mode 100644 evidence/by-test-id/IT-009.md
>  create mode 100644 evidence/by-test-id/IT-010.md
>  create mode 100644 evidence/by-test-id/IT-011.md
>  create mode 100644 evidence/by-test-id/IT-012.md
>  create mode 100644 evidence/by-test-id/PT-001.md
>  create mode 100644 evidence/by-test-id/PT-002.md
>  create mode 100644 evidence/by-test-id/PT-003.md
>  create mode 100644 evidence/by-test-id/PT-004.md
>  create mode 100644 evidence/by-test-id/PT-005.md
>  create mode 100644 evidence/by-test-id/PT-007.md
>  create mode 100644 evidence/by-test-id/PT-008.md
>  create mode 100644 evidence/by-test-id/PT-009.md
>  create mode 100644 evidence/by-test-id/ST-F-001.md
>  create mode 100644 evidence/by-test-id/ST-F-002.md
>  create mode 100644 evidence/by-test-id/ST-F-003.md
>  create mode 100644 evidence/by-test-id/ST-F-004.md
>  create mode 100644 evidence/by-test-id/ST-F-005.md
>  create mode 100644 evidence/by-test-id/ST-F-006.md
>  create mode 100644 evidence/by-test-id/ST-F-007.md
>  create mode 100644 evidence/by-test-id/ST-F-008.md
>  create mode 100644 evidence/by-test-id/ST-F-009.md
>  create mode 100644 evidence/by-test-id/ST-F-010.md
>  create mode 100644 evidence/by-test-id/ST-IOT-002.md
>  create mode 100644 evidence/by-test-id/ST-IOT-003.md
>  create mode 100644 evidence/by-test-id/ST-IOT-004.md
>  create mode 100644 evidence/by-test-id/ST-IOT-007.md
>  create mode 100644 evidence/by-test-id/ST-IOT-008.md
>  create mode 100644 evidence/by-test-id/ST-NF-001.md
>  create mode 100644 evidence/by-test-id/ST-NF-002.md
>  create mode 100644 evidence/by-test-id/ST-NF-003.md
>  create mode 100644 evidence/by-test-id/ST-NF-004.md
>  create mode 100644 evidence/by-test-id/ST-NF-005.md
>  create mode 100644 evidence/by-test-id/ST-NF-006.md
>  create mode 100644 evidence/by-test-id/ST-NF-007.md
>  create mode 100644 evidence/by-test-id/ST-NF-008.md
>  create mode 100644 evidence/by-test-id/ST-NF-009.md
>  create mode 100644 evidence/by-test-id/UT-001.md
>  create mode 100644 evidence/by-test-id/UT-002.md
>  create mode 100644 evidence/by-test-id/UT-003.md
>  create mode 100644 evidence/by-test-id/UT-004.md
>  create mode 100644 evidence/by-test-id/UT-005.md
>  create mode 100644 evidence/by-test-id/UT-006.md
>  create mode 100644 evidence/by-test-id/UT-007.md
>  create mode 100644 evidence/by-test-id/UT-008.md
>  create mode 100644 evidence/by-test-id/UT-009.md
>  create mode 100644 evidence/by-test-id/UT-010.md
>  create mode 100644 evidence/by-test-id/UT-011.md
>  create mode 100644 evidence/by-test-id/UT-012.md
>  create mode 100644 evidence/by-test-id/UT-013.md
>  create mode 100644 evidence/by-test-id/UT-014.md
>  create mode 100644 evidence/by-test-id/UT-015.md
>  create mode 100644 evidence/by-test-id/_INDEX.txt
>  create mode 100644 evidence/capture_api_evidence.mjs
>  create mode 100644 evidence/capture_batch_live.mjs
>  create mode 100644 evidence/capture_evidence.mjs
>  create mode 100644 evidence/capture_live.mjs
>  create mode 100644 evidence/capture_live_admin.mjs
>  create mode 100644 evidence/generate_evidence.py
>  create mode 100644 evidence/make_submission_zip.ps1
>  create mode 100644 evidence/render_perf_shots.mjs
>  create mode 100644 evidence/reports/api-evidence.txt
>  create mode 100644 evidence/reports/coverage.txt
>  create mode 100644 evidence/reports/e2e-output.txt
>  create mode 100644 evidence/reports/live-api-evidence.txt
>  create mode 100644 evidence/reports/live-auth-tests.txt
>  create mode 100644 evidence/reports/live-form-tests.txt
>  create mode 100644 evidence/reports/perf_table.html
>  create mode 100644 evidence/reports/performance-benchmark.txt
>  create mode 100644 evidence/reports/unit-test-output.txt
>  create mode 100644 evidence/screenshots/A-dashboard-live.png
>  create mode 100644 evidence/screenshots/A-live-admin.png
>  create mode 100644 evidence/screenshots/A-live-health.png
>  create mode 100644 evidence/screenshots/E-load.png
>  create mode 100644 evidence/screenshots/IT-012.png
>  create mode 100644 evidence/screenshots/PT-001.png
>  create mode 100644 evidence/screenshots/PT-002.png
>  create mode 100644 evidence/screenshots/PT-003.png
>  create mode 100644 evidence/screenshots/PT-004.png
>  create mode 100644 evidence/screenshots/PT-005.png
>  create mode 100644 evidence/screenshots/PT-007.png
>  create mode 100644 evidence/screenshots/PT-008.png
>  create mode 100644 evidence/screenshots/PT-009.png
>  create mode 100644 evidence/screenshots/ST-F-001-admin-dashboard.png
>  create mode 100644 evidence/screenshots/ST-F-001.png
>  create mode 100644 evidence/screenshots/ST-F-001a-login-screen.png
>  create mode 100644 evidence/screenshots/ST-F-002-mobile-home.png
>  create mode 100644 evidence/screenshots/ST-F-002.png
>  create mode 100644 evidence/screenshots/ST-F-005-admin-analytics.png
>  create mode 100644 evidence/screenshots/ST-F-005.png
>  create mode 100644 evidence/screenshots/ST-IOT-002.png
>  create mode 100644 evidence/screenshots/ST-IOT-003-kiosk-scan.png
>  create mode 100644 evidence/screenshots/ST-IOT-003.png
>  create mode 100644 evidence/screenshots/ST-NF-005-brute-force-lockout.png
>  create mode 100644 evidence/screenshots/ST-NF-005.png
>  create mode 100644 evidence/screenshots/ST-NF-006.png
>  create mode 100644 evidence/screenshots/ST-NF-007.png
>  create mode 100644 evidence/screenshots/UT-006-wrong-password.png
>  create mode 100644 evidence/screenshots/UT-006.png
>  create mode 100644 evidence/test_live_auth.mjs
>  create mode 100644 evidence/test_live_form.mjs
>  create mode 100644 fill_form.py
>  create mode 100644 packages/backend/src/machine-routes.js
>  create mode 100644 run-tests.cmd
> [+] Building 169.2s (48/48) FINISHED
>  => [internal] load local bake definitions                                                                                                                                  0.0s
>  => => reading from stdin 951B                                                                                                                                              0.0s
>  => [api internal] load build definition from Dockerfile                                                                                                                    0.1s
>  => => transferring dockerfile: 6.92kB                                                                                                                                      0.0s
>  => [web] resolve image config for docker-image://docker.io/docker/dockerfile:1                                                                                             2.4s 
>  => [api] docker-image://docker.io/docker/dockerfile:1@sha256:572cebbc2b15e6f84c077742952674889cb63cd5e9b80abdffcbe587b6f19183                                              1.0s
>  => => resolve docker.io/docker/dockerfile:1@sha256:572cebbc2b15e6f84c077742952674889cb63cd5e9b80abdffcbe587b6f19183                                                        0.0s 
>  => => sha256:03f648a05b5780c2a0e4b43c93eb1838c6b9b32131b25f4199f42a788d106315 15.19MB / 15.19MB                                                                            0.5s
>  => => extracting sha256:03f648a05b5780c2a0e4b43c93eb1838c6b9b32131b25f4199f42a788d106315                                                                                   0.4s
>  => [web internal] load metadata for docker.io/library/node:22-bookworm-slim                                                                                                2.1s
>  => [web internal] load metadata for docker.io/library/caddy:2-alpine                                                                                                       2.3s 
>  => [web internal] load .dockerignore                                                                                                                                       0.0s
>  => => transferring context: 991B                                                                                                                                           0.0s 
>  => [api api  1/15] FROM docker.io/library/node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee                                    9.2s
>  => => resolve docker.io/library/node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee                                              0.1s 
>  => => sha256:aa4e8910862263c3bad50c754fb555bbbb7661c41e35ba703ae082ec6749c175 1.71MB / 1.71MB                                                                              0.3s
>  => => sha256:cce880541c96dc730321857781d113e3c75c0cb383f9510300922762006d734e 448B / 448B                                                                                  0.5s 
>  => => sha256:0c4023204e5b4bcd551170279c40ff58285cc8ea87ddf9ff25cb3713e6ecda79 49.90MB / 49.90MB                                                                            2.7s 
>  => => sha256:076cba098ace87d6950e8fa4cc530bfe59834eba28f30061e8526d6f00bf52c8 3.31kB / 3.31kB                                                                              0.7s 
>  => => sha256:dd051e1b8c92ff101fa3071ab97ea4924885942f15644e01c3dc095764e863e3 28.25MB / 28.25MB                                                                            1.8s 
>  => => extracting sha256:dd051e1b8c92ff101fa3071ab97ea4924885942f15644e01c3dc095764e863e3                                                                                   3.6s 
>  => => extracting sha256:076cba098ace87d6950e8fa4cc530bfe59834eba28f30061e8526d6f00bf52c8                                                                                   0.0s 
>  => => extracting sha256:0c4023204e5b4bcd551170279c40ff58285cc8ea87ddf9ff25cb3713e6ecda79                                                                                   2.6s 
>  => => extracting sha256:aa4e8910862263c3bad50c754fb555bbbb7661c41e35ba703ae082ec6749c175                                                                                   0.3s 
>  => => extracting sha256:cce880541c96dc730321857781d113e3c75c0cb383f9510300922762006d734e                                                                                   0.0s 
>  => [api internal] load build context                                                                                                                                       0.3s 
>  => => transferring context: 1.72MB                                                                                                                                         0.2s 
>  => [web web 1/5] FROM docker.io/library/caddy:2-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0                                             5.5s 
>  => => resolve docker.io/library/caddy:2-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0                                                     0.1s 
>  => => sha256:5000c332a1cc372a1a248c2923696c0bc7817d213f2db0f4161fc18a3fc17cd7 18.13MB / 18.13MB                                                                            1.2s 
>  => => sha256:e3a802d3a0a957e15ac518be2f3f3e786b9965895265888c3390753c81d1c085 7.50kB / 7.50kB                                                                              0.3s 
>  => => sha256:c4d6974dbf71e422d13654405f502ff60ea306943b999003c012ecc6dd93d317 2.80MB / 2.80MB                                                                              0.5s 
>  => => sha256:881fc932939efef04ca120ad44bbd2c0917851eb247aa4995428afb1e80ede17 3.85MB / 3.85MB                                                                              0.4s 
>  => => extracting sha256:881fc932939efef04ca120ad44bbd2c0917851eb247aa4995428afb1e80ede17                                                                                   0.7s 
>  => => extracting sha256:c4d6974dbf71e422d13654405f502ff60ea306943b999003c012ecc6dd93d317                                                                                   0.3s 
>  => => extracting sha256:e3a802d3a0a957e15ac518be2f3f3e786b9965895265888c3390753c81d1c085                                                                                   0.0s 
>  => => extracting sha256:5000c332a1cc372a1a248c2923696c0bc7817d213f2db0f4161fc18a3fc17cd7                                                                                   1.9s 
>  => => extracting sha256:4f4fb700ef54461cfa02571ae0db9a0dc1e0cdb5577484a6d75e68dc38e8acc1                                                                                   0.0s 
>  => [web internal] load build context                                                                                                                                       0.3s 
>  => => transferring context: 1.52MB                                                                                                                                         0.3s 
>  => [web web 2/5] COPY Caddyfile /etc/caddy/Caddyfile                                                                                                                       0.2s 
>  => [api api  2/15] WORKDIR /app                                                                                                                                            0.1s 
>  => [api api  3/15] COPY package.json package-lock.json ./                                                                                                                  0.1s 
>  => [web api  4/15] COPY packages/core/package.json            ./packages/core/                                                                                             0.0s 
>  => [web api  5/15] COPY packages/backend/package.json         ./packages/backend/                                                                                          0.1s 
>  => [api api  6/15] COPY packages/mobile-app/package.json      ./packages/mobile-app/                                                                                       0.0s 
>  => [web api  7/15] COPY packages/admin-panel/package.json     ./packages/admin-panel/                                                                                      0.0s 
>  => [web api  8/15] COPY packages/kiosk-app/package.json       ./packages/kiosk-app/                                                                                        0.1s 
>  => [api api  9/15] COPY packages/backend-laravel/package.json ./packages/backend-laravel/                                                                                  0.0s 
>  => [api api 10/15] RUN npm ci --omit=dev --workspace=@waste2goods/backend --include-workspace-root       || npm ci --omit=dev  && npm cache clean --force                 32.9s 
>  => CACHED [web deps  3/10] COPY package.json package-lock.json ./                                                                                                          0.0s 
>  => CACHED [web deps  4/10] COPY packages/core/package.json            ./packages/core/                                                                                     0.0s 
>  => CACHED [web deps  5/10] COPY packages/backend/package.json         ./packages/backend/                                                                                  0.0s 
>  => CACHED [web deps  6/10] COPY packages/mobile-app/package.json      ./packages/mobile-app/                                                                               0.0s 
>  => CACHED [web deps  7/10] COPY packages/admin-panel/package.json     ./packages/admin-panel/                                                                              0.0s 
>  => CACHED [web deps  8/10] COPY packages/kiosk-app/package.json       ./packages/kiosk-app/                                                                                0.0s 
>  => CACHED [web deps  9/10] COPY packages/backend-laravel/package.json ./packages/backend-laravel/                                                                          0.0s 
>  => [web deps 10/10] RUN npm ci                                                                                                                                           103.3s 
>  => [api api 11/15] COPY packages/core/src         ./packages/core/src                                                                                                      0.4s 
>  => [api api 12/15] COPY packages/backend/src      ./packages/backend/src                                                                                                   0.1s 
>  => [api api 13/15] COPY packages/backend/public   ./packages/backend/public                                                                                                0.1s
>  => [api api 14/15] COPY packages/backend/database ./packages/backend/database                                                                                              0.1s 
>  => [api api 15/15] RUN mkdir -p packages/backend/models                                                                                                                    0.7s 
>  => [api] exporting to image                                                                                                                                               34.1s 
>  => => exporting layers                                                                                                                                                    13.4s 
>  => => exporting manifest sha256:addb04a629ef68623c7bc2ad33e88251d43f6985bdf632d3f95e093fa047a0ef                                                                           0.0s 
>  => => exporting config sha256:a402b6fee6f14e5c606cbb6a14fda328e880bad52ad0faa7bd9972bda2c49d77                                                                             0.0s 
>  => => exporting attestation manifest sha256:886f219b875d010de08149e4eeb6e9fe0b27448802ca8e86d5794ef6e3f408f2                                                               0.0s 
>  => => exporting manifest list sha256:df3d9080ef0b44059340430981276269dfbaf36e30a8dfd62c8e7e4373947c26                                                                      0.0s 
>  => => naming to docker.io/library/waste2goods-api:latest                                                                                                                   0.0s 
>  => => unpacking to docker.io/library/waste2goods-api:latest                                                                                                               20.4s 
>  => [api] resolving provenance for metadata file                                                                                                                            0.1s 
>  => [web frontend-build 1/7] COPY packages/core        ./packages/core                                                                                                      1.1s 
>  => [web frontend-build 2/7] COPY packages/mobile-app  ./packages/mobile-app                                                                                                0.1s 
>  => [web frontend-build 3/7] COPY packages/admin-panel ./packages/admin-panel                                                                                               0.1s 
>  => [web frontend-build 4/7] COPY packages/kiosk-app   ./packages/kiosk-app                                                                                                 0.0s 
>  => [web frontend-build 5/7] RUN npm run build --workspace=@waste2goods/mobile-app -- --base=/                                                                             16.5s 
>  => [web frontend-build 6/7] RUN npm run build --workspace=@waste2goods/admin-panel -- --base=/admin/                                                                      20.0s 
>  => [web frontend-build 7/7] RUN npm run build --workspace=@waste2goods/kiosk-app   -- --base=/kiosk/                                                                       9.7s 
>  => [web web 3/5] COPY --from=frontend-build /app/packages/mobile-app/dist  /srv/mobile                                                                                     0.1s 
>  => [web web 4/5] COPY --from=frontend-build /app/packages/admin-panel/dist /srv/admin                                                                                      0.0s 
>  => [web web 5/5] COPY --from=frontend-build /app/packages/kiosk-app/dist   /srv/kiosk                                                                                      0.0s 
>  => [web] exporting to image                                                                                                                                                1.7s 
>  => => exporting layers                                                                                                                                                     0.3s 
>  => => exporting manifest sha256:ffb2016f3840d7452284691bc41f1a5c8602bb4cf51ff619ffec0db119d1ed96                                                                           0.0s 
>  => => exporting config sha256:19399b3f1172b8f3f91de052ab3b13d8eaa4d827653678c7bc59ab234e1d2ea5                                                                             0.0s 
>  => => exporting attestation manifest sha256:a36022b49d3ba62bbee3ac7789585d7e962936d221ee3e9f5b19fcb814fef5f1                                                               0.0s 
>  => => exporting manifest list sha256:a2736e69939d29bb5160b988bb191e024337a484483f9a5f8cc08bb477886985                                                                      0.0s 
>  => => naming to docker.io/library/waste2goods-web:latest                                                                                                                   0.0s 
>  => => unpacking to docker.io/library/waste2goods-web:latest                                                                                                                1.3s 
>  => [web] resolving provenance for metadata file                                                                                                                            0.0s 
> [+] up 6/6
>  ✔ Image waste2goods-api         Built                                                                                                                                     169.5s
>  ✔ Image waste2goods-web         Built                                                                                                                                     169.5s
>  ✔ Container waste2goods-db-1    Healthy                                                                                                                                    12.7s
>  ✔ Container waste2goods-redis-1 Running                                                                                                                                     0.0s
>  ✔ Container waste2goods-api-1   Started                                                                                                                                    13.0s
>  ✔ Container waste2goods-web-1   Started                                                                                                                                     2.1s
> 65
> root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods#

# Claude — Nov 20, 2026, 7:27 PM

The deploy worked. The `65` at the end means the key reached the API container. The build finished, the api and web containers started, and `git pull` brought in `machine-routes.js` and the updated `index-mysql.js` and `schema-mysql.sql`. The `docker-compose.yml` edit didn't conflict with the pull.

One gap: the `docker compose logs --tail=50 api` output is missing from what you pasted. Check it once, in the droplet:

```bash
docker compose logs --tail=30 api
```

You want to see the API running with no crash or restart loop.

**Test the live site from your PC (PowerShell)**

Replace `YOUR_KEY` with the real key, and don't paste it back to me:

```powershell
$body = @{ transaction_id="live-test-0001"; machine_id="K-01"; bottles=3; points=15; code="LIVE2345" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://waste2goods.site/api/machine/transactions" -Headers @{ "X-Machine-Key"="YOUR_KEY" } -ContentType "application/json" -Body $body
```

It should print `ok: True`, `depositId: live-test-0001` and `pointsAwarded: 15`. If you run it a second time, you'll get `{"status":"duplicate"}`, as in your local test.

- A **401 or 403** means the key doesn't match what's on the droplet.
- A **404 or 502** means the API isn't up, so send me the logs.
- If `machine_id="K-01"` is rejected, the kiosk table on the live database may use a different ID, so send me the error.

**Delete the test row** afterward, in the droplet:

```bash
cd /home/deploy/waste2goods
export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)
export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" -e "DELETE FROM machine_deposits WHERE depositId='live-test-0001';"
```

The deposit stays unclaimed until someone redeems the code, so deleting it affects no user's points.

**Point the machine at the live site.** In `trainmodel\.env`, set `API_URL=https://waste2goods.site/api/machine/transactions` and use the same key as `X-Machine-Key`.

Tell me what the logs and the live test print.

# Human — Nov 20, 2026, 7:47 PM

root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# $body = @{ transaction_id="live-test-0001"; machine_id="K-01"; bottles=3; points=15; code="LIVE2345" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://waste2goods.site/api/machine/transactions" -Headers @{ "X-Machine-Key"="Y67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb" } -ContentType "application/json" -Body $body
=: command not found
}: command not found
ConvertTo-Json: command not found
Invoke-RestMethod: command not found
root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods#

# Claude — Nov 20, 2026, 7:47 PM

That was PowerShell, and you ran it in the droplet, which is Linux and uses bash. That's why you got `command not found`. Your pasted key also has an extra `Y` at the start (`Y67bf...`), left over from `YOUR_KEY`. It would have failed with a 401 or 403 even in the right window.

The easiest fix is to run the test from the droplet, which reads the key from `.env` so you don't type it:

```bash
cd /home/deploy/waste2goods
KEY=$(grep '^MACHINE_API_KEY=' .env | cut -d= -f2-)
curl -s -X POST https://waste2goods.site/api/machine/transactions \
  -H "X-Machine-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"live-test-0001","machine_id":"K-01","bottles":3,"points":15,"code":"LIVE2345"}'
```

A working test prints something like:

```
{"ok":true,"depositId":"live-test-0001","pointsAwarded":15}
```

If you want to run it from your PC instead, use the PowerShell version from before in a PowerShell window, with the key pasted exactly and no leading `Y`.

If you get an error, send me the output, and also `docker compose logs --tail=30 api`.

# Human — Nov 20, 2026, 7:49 PM

PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype> $body = @{ transaction_id="live-test-0001"; machine_id="K-01"; bottles=3; points=15; code="LIVE2345" } | ConvertTo-Json   
PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype> Invoke-RestMethod -Method Post -Uri "https://waste2goods.site/api/machine/transactions" -Headers @{ "X-Machine-Key"="Y67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb" } -ContentType "application/json" -Body $body
Invoke-RestMethod : {"error":"Invalid machine key"}
At line:1 char:1
+ Invoke-RestMethod -Method Post -Uri "https://waste2goods.site/api/mac ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidOperation: (System.Net.HttpWebRequest:HttpWebRequest) [Invoke-RestMethod], WebException
    + FullyQualifiedErrorId : WebCmdletWebResponseException,Microsoft.PowerShell.Commands.InvokeRestMethodCommand
PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype> 
in winodws

# Claude — Nov 20, 2026, 7:49 PM

The server is working. `{"error":"Invalid machine key"}` means the live site is up and the new code is running, and it rejected the key because of the stray `Y` at the start. The key is 64 characters, and yours has 65.

Run this in PowerShell, with the `Y` removed:

```powershell
$body = @{ transaction_id="live-test-0001"; machine_id="K-01"; bottles=3; points=15; code="LIVE2345" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://waste2goods.site/api/machine/transactions" -Headers @{ "X-Machine-Key"="67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb" } -ContentType "application/json" -Body $body
```

You should get `ok: True`, `depositId: live-test-0001` and `pointsAwarded: 15`.

Make sure `trainmodel\.env` has the key without the `Y` too, or the machine will fail the same way.

Once the test works, delete the test row in the droplet:

```bash
cd /home/deploy/waste2goods
export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)
export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" -e "DELETE FROM machine_deposits WHERE depositId='live-test-0001';"
```

# Human — Nov 20, 2026, 7:50 PM

+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~$body = @{ transaction_id="live-test-0001"; machine_id="K-01"; bottles=3; points=15; code="LIVE2345" } | ConvertTo-JsonInfo          : InvalidOperation: (System.Net.HttpWebRequest:HttpWebRequest) [Invoke-RestMethod], WebException
>> Invoke-RestMethod -Method Post -Uri "https://waste2goods.site/api/machine/transactions" -Headers @{ "X-Machine-Key"="67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb" } -ContentType "application/json" -Body $bodytype>
Invoke-RestMethod : {"status":"duplicate"}
At line:2 char:1
+ Invoke-RestMethod -Method Post -Uri "https://waste2goods.site/api/mac ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidOperation: (System.Net.HttpWebRequest:HttpWebRequest) [Invoke-RestMethod], WebException
    + FullyQualifiedErrorId : WebCmdletWebResponseException,Microsoft.PowerShell.Commands.InvokeRestMethodCommand
PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype>

# Claude — Nov 20, 2026, 7:50 PM

`{"status":"duplicate"}` is a good result. The server accepted your key, and a deposit with ID `live-test-0001` is already saved. The paste got mixed up on screen, so one of the earlier runs must have succeeded and this one was the repeat. The live endpoint, the key and the new `machine_deposits` table all work.

**1. Delete the test row** in the droplet:

```bash
cd /home/deploy/waste2goods
export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)
export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" -e "DELETE FROM machine_deposits WHERE depositId='live-test-0001';"
docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" -e "SELECT depositId, status FROM machine_deposits;"
```

The second command should come back empty, or show only real deposits. Until you delete the row, `LIVE2345` is an unclaimed 15-point code that anyone could redeem.

**2. Point the machine at the live site.** In `trainmodel\.env` on your PC, set:

```
API_URL=https://waste2goods.site/api/machine/transactions
```

Use the 64-character key with no `Y`, in whichever variable the machine reads it from.

**3. Run one real bottle through the machine.** Check that a deposit with a redeem code appears, then redeem it in the app.

Tell me how that goes, or if the machine sends an error.

# Human — Nov 20, 2026, 7:52 PM

root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# cd /home/deploy/waste2goods
KEY=$(grep '^MACHINE_API_KEY=' .env | cut -d= -f2-)
curl -s -X POST https://waste2goods.site/api/machine/transactions \
  -H "X-Machine-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"live-test-0001","machine_id":"K-01","bottles":3,"points":15,"code":"LIVE2345"}'
root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# cd /home/deploy/waste2goods
export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)
export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" -e "DELETE FROM machine_deposits WHERE depositId='live-test-0001';"
docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" -e "SELECT depositId, status FROM machine_deposits;"
mysql: [Warning] Using a password on the command line interface can be insecure.
mysql: [Warning] Using a password on the command line interface can be insecure.
root@ubuntu-s-1vcpu-2gb-sgp1:/home/deploy/waste2goods# 

unsay pasabot ani?
The second command should come back empty, or show only real deposits. Until you delete the row, `LIVE2345` is an unclaimed 15-point code that anyone could redeem.
2. Point the machine at the live site. In `trainmodel\.env` on your PC, set:

```
API_URL=https://waste2goods.site/api/machine/transactions
```

Use the 64-character key with no `Y`, in whichever variable the machine reads it from.

# Claude — Nov 20, 2026, 7:52 PM

Maayo na ang resulta. Ako i-explain ang duha ka parte.

**1. Ang `SELECT` nga walay ggawas**

Ang duha ka `mysql` command nagpakita lang og warning (normal ra kana). Walay lista nga mogawas sa `SELECT`, so **walay sulod ang `machine_deposits` table**. Ang test row nga `live-test-0001` na-delete na.

Ang gipasabot nako sa `LIVE2345`: kadtong test deposit adunay code nga `LIVE2345` nga nagkantidad og 15 points. Kung dili pa na-delete, bisan kinsa nga makahibalo sa code makakuha unta og 15 points. Karon na-delete na, mao nga safe na.

**2. Ang `trainmodel\.env`**

Kini nga file naa sa imong PC, sa folder sa machine/model program (`trainmodel`). Doon gikuha sa program ang settings kung asa niya ipadala ang bottle deposits. Karon ang program nagpadala pa sa imong local test server (`localhost:3001`), dili pa sa live site.

Buhata ni:

1. Ablihi ang `trainmodel\.env` sa Notepad.
2. Pangitaa ang linya nga `API_URL=...` ug usba ni:
   ```
   API_URL=https://waste2goods.site/api/machine/transactions
   ```
3. Pangitaa ang linya nga naay key (tingali `test-key-123` pa, kini nga key gigamit sa local test) ug ilisi sa tinuod nga key. Ibutang gyud nga **64 characters, walay `Y` sa sinugdan**, ug walay quotes o space.
4. I-save ug i-run pag-usab ang machine program.

Dili nako makita ang ngalan sa variable sa key sa imong `trainmodel\.env`, mao nga ilisi lang ang value sa kana nga linya. Kung dili ka sigurado kung hain, i-paste ang file diri **nga gitabunan ang key**, ug ako mo-tudlo kung asa.

Sa katapusan, sulayi og isa ka tinuod nga bote sa machine. Kung mugawas ang redeem code, mao nang kompleto na ang system.

# Human — Nov 20, 2026, 7:52 PM

answer in english

# Claude — Nov 20, 2026, 7:52 PM

Sure, here's the same explanation in English.

**1. The empty `SELECT` result**

The two `mysql` commands printed only the password warning, which is normal. The `SELECT` listed no rows, so `machine_deposits` is empty and the test row `live-test-0001` is deleted.

Until that row was deleted, `LIVE2345` was an unclaimed 15-point code, and anyone who knew it could have redeemed it. Now that it's gone, that risk is gone too.

**2. The `trainmodel\.env` file**

This file is on your PC, in the folder of the machine/model program (`trainmodel`). It tells the program where to send bottle deposits. Right now it probably still points to your local test server (`localhost:3001`), not the live site.

1. Open `trainmodel\.env` in Notepad.
2. Find the `API_URL=...` line and change it to:
   ```
   API_URL=https://waste2goods.site/api/machine/transactions
   ```
3. Find the line that holds the key. It may still be `test-key-123` from your local testing. Replace the value with the real key: 64 characters, no `Y` at the start, no quotes and no spaces.
4. Save the file and restart the machine program.

I can't see the variable name the key uses in your `trainmodel\.env`, so just replace the value on that line. If you're not sure which line it is, paste the file here with the key hidden and I'll point to it.

Finally, put one real bottle through the machine. If a redeem code appears and you can redeem it in the app, the whole system is working.

# Human — Nov 20, 2026, 7:53 PM

is this it?

```dotenv
API_URL=https://waste2goods.site/api/machine/transactions
MACHINE_API_KEY=67bf7de8811e333636c3c8cf853847c5937906566bcd238af557107d29e179eb
MACHINE_ID=K-01
```

# Claude — Nov 20, 2026, 7:53 PM

Yes, that looks right.

- **`API_URL`** points to the live site.
- **`MACHINE_API_KEY`** is 64 characters with no `Y`, quotes or spaces, so it matches the droplet.
- **`MACHINE_ID=K-01`** is a kiosk the live database accepts, since your live test with `K-01` went through.

I can't see the machine program's code, so I can't confirm it reads exactly these three names. If it doesn't pick up the values, check which names it uses. If it reads `API_KEY` instead of `MACHINE_API_KEY`, for example, rename that line.

Make sure the file is saved. Then restart the machine program and put one real bottle through it. The program should show a successful send and a redeem code. If it shows an error, send me the message. You can also check on the droplet that the row arrived:

```bash
cd /home/deploy/waste2goods
export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)
export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" -e "SELECT depositId, kioskId, redeemCode, bottles, status FROM machine_deposits;"
```

You should see one row with status `unclaimed`. Redeem its code in the app, and the status should change to claimed.

# Human — Nov 20, 2026, 7:54 PM

now all done what next e run na nako?

# Claude — Nov 20, 2026, 7:54 PM

Yes, now run the machine program. In PowerShell:

```powershell
cd C:\Users\USER\Downloads\trainmodel
python count_bottles.py
```

1. **Keep the tunnel empty for the first 5 seconds.** The program uses that time to set its baseline.
2. **Put one real bottle through.** The LCD should show "Bottle OK! +5 points", and the program should report that the deposit was sent. If it shows an error instead, copy the message here.
3. **Check that the deposit reached the live site.** On the droplet, run the `SELECT` command from my last message. You should see one row with status `unclaimed` and a redeem code.
4. **Redeem the code in the app** at waste2goods.site, logged in as a resident. The points should go up by 5 per bottle, and the row's status should change to claimed.

If all four work, the whole chain is working: camera, model, machine, live server and app.

If something fails, send me the error from the program or the droplet. Only share the key if I ask, and hide it first.

# Human — Nov 20, 2026, 7:55 PM

btw how to see the database in the digital ocean?

# Claude — Nov 20, 2026, 7:55 PM

Your database isn't a DigitalOcean managed database. It's the MySQL container (`db`) running inside your droplet, so the DigitalOcean dashboard won't show its tables. You open it through the droplet.

**Option 1: Command line (easiest, works now)**

SSH in, then open an interactive MySQL session:

```bash
ssh root@129.212.239.28
cd /home/deploy/waste2goods
export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)
export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
docker compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"
```

At the `mysql>` prompt, try:

```sql
SHOW TABLES;
SELECT * FROM machine_deposits;
SELECT userId, email, points FROM users LIMIT 10;
exit
```

I'm guessing the column names in the `users` query, so if it errors, run `DESCRIBE users;` first to see the real ones. End each SQL statement with a semicolon.

**Option 2: A visual tool (DBeaver, HeidiSQL or MySQL Workbench) on your PC**

These can connect through an SSH tunnel, so you don't have to open the database to the internet. In the tool's connection settings, choose "SSH tunnel" and enter:

- **SSH host:** `129.212.239.28`, user `root`
- **MySQL host:** `127.0.0.1`, port `3306`, user `root`, and the `MYSQL_ROOT_PASSWORD` from your `.env`

I can't see whether your `docker-compose.yml` publishes port 3306 to the host. Check with:

```bash
docker compose port db 3306
```

If it prints nothing, the tool can't connect that way, and Option 1 is the simpler path.

Don't open port 3306 in the DigitalOcean firewall. A database with the root password open to the internet gets attacked quickly. Use the SSH tunnel only.

# Human — Nov 20, 2026, 7:56 PM

> **Attachment: attachment · txt · 4.1 KB**
>
> PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype> ssh root@129.212.239.28
> >> cd /home/deploy/waste2goods
> >> export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)
> >> export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
> >> docker compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"
> Welcome to Ubuntu 24.04.5 LTS (GNU/Linux 6.8.0-142-generic x86_64)
> 
>  * Documentation:  https://help.ubuntu.com
>  * Management:     https://landscape.canonical.com
>  * Support:        https://ubuntu.com/pro
> 
>  System information as of Fri Nov 20 11:55:59 UTC 2026
> 
>   System load:  0.06               Processes:             118
>   Usage of /:   20.9% of 47.39GB   Users logged in:       1
>   Memory usage: 46%                IPv4 address for eth0: 129.212.239.28
>   Swap usage:   18%                IPv4 address for eth0: 10.15.0.5
> 
> Expanded Security Maintenance for Applications is not enabled.
> 
> 36 updates can be applied immediately.
> To see these additional updates run: apt list --upgradable
> 
> Enable ESM Apps to receive additional future security updates.
> See https://ubuntu.com/esm or run: sudo pro status
> 
> New release '26.04.1 LTS' available.
> Run 'do-release-upgrade' to upgrade to it.
> 
> 
> *** System restart required ***
> Last login: Fri Nov 20 11:03:10 2026 from 111.90.247.227
> root@ubuntu-s-1vcpu-2gb-sgp1:~# SHOW TABLES;
> SELECT * FROM machine_deposits;
> SELECT userId, email, points FROM users LIMIT 10;
> exit
> SHOW: command not found
> SELECT: command not found
> SELECT: command not found
> logout
> Connection to 129.212.239.28 closed.
> cd : Cannot find path 'C:\home\deploy\waste2goods' because it does not exist.
> At line:2 char:1
> + cd /home/deploy/waste2goods
> + ~~~~~~~~~~~~~~~~~~~~~~~~~~~
>     + CategoryInfo          : ObjectNotFound: (C:\home\deploy\waste2goods:String) [Set-Location], ItemNotFoundException
>     + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.SetLocationCommand
> 
> grep : The term 'grep' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, 
> verify that the path is correct and try again.
> At line:3 char:30
> + export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut  ...
> +                              ~~~~
>     + CategoryInfo          : ObjectNotFound: (grep:String) [], CommandNotFoundException
>     + FullyQualifiedErrorId : CommandNotFoundException
> 
> export : The term 'export' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was 
> included, verify that the path is correct and try again.
> At line:3 char:1
> + export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut  ...
> + ~~~~~~
>     + CategoryInfo          : ObjectNotFound: (export:String) [], CommandNotFoundException
>     + FullyQualifiedErrorId : CommandNotFoundException
> 
> grep : The term 'grep' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, 
> verify that the path is correct and try again.
> At line:4 char:18
> + export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
> +                  ~~~~
>     + CategoryInfo          : ObjectNotFound: (grep:String) [], CommandNotFoundException
>     + FullyQualifiedErrorId : CommandNotFoundException
> 
> export : The term 'export' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was 
> included, verify that the path is correct and try again.
> At line:4 char:1
> + export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
> + ~~~~~~
>     + CategoryInfo          : ObjectNotFound: (export:String) [], CommandNotFoundException
>     + FullyQualifiedErrorId : CommandNotFoundException
> 
> failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
> PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype>

# Claude — Nov 20, 2026, 7:56 PM

Everything ran, but in the wrong order and the wrong places. Pasting all the lines at once made PowerShell and the droplet's shell mix them up:

- `ssh` connected and gave you the `root@ubuntu...#` prompt.
- The `cd`, `export` and `docker` lines didn't run there, so you never got into MySQL.
- The SQL lines (`SHOW TABLES;` and so on) were then typed into the droplet shell, which doesn't understand SQL. That's why you got `SHOW: command not found`.
- `exit` logged you out, and the leftover `cd` and `export` lines ran on your Windows PC, where they fail.

The fix is to run it in three separate steps and wait for each one to finish.

**Step 1: Connect.** In PowerShell, paste only this line and press Enter:

```powershell
ssh root@129.212.239.28
```

Wait until the prompt starts with `root@ubuntu-s-1vcpu-2gb-sgp1`.

**Step 2: Open MySQL.** At that prompt, paste these four lines:

```bash
cd /home/deploy/waste2goods
export MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)
export DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
docker compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"
```

The prompt should change to `mysql>`. Don't continue until you see it.

**Step 3: Run the SQL.** At the `mysql>` prompt, paste:

```sql
SHOW TABLES;
SELECT * FROM machine_deposits;
exit
```

If you want to look at users, first run `DESCRIBE users;` to see the real column names, since I guessed them last time.

`exit` leaves MySQL. To leave the droplet too, type `exit` again.

# Human — Nov 20, 2026, 7:57 PM

how to see it in web is it possible?

# Claude — Nov 20, 2026, 7:57 PM

Yes, it's possible. DigitalOcean has no web viewer for a database running inside your own droplet, so the usual way is **Adminer**, a small web page for browsing MySQL. You run it in a container and open it through a private SSH tunnel, so it is never public.

**Step 1: Start Adminer** in the droplet. Connect with `ssh root@129.212.239.28` and run:

```bash
docker run -d --name adminer --restart unless-stopped \
  --network waste2goods_default \
  -p 127.0.0.1:8080:8080 \
  -e ADMINER_DEFAULT_SERVER=db \
  adminer
```

- `127.0.0.1:8080` means only the droplet itself can reach it, not the internet.
- `waste2goods_default` is the network name I'd expect from your folder name. If you get a "network not found" error, run `docker network ls` and use the one that ends in `_default`.
- This doesn't touch your `docker-compose.yml` or restart your app.

Then print the database password so you can copy it, and type `exit` to leave the droplet:

```bash
cd /home/deploy/waste2goods
grep '^MYSQL_ROOT_PASSWORD=' .env
exit
```

Copy only the part after the `=`.

**Step 2: Open the tunnel from your PC.** In PowerShell:

```powershell
ssh -N -L 8080:127.0.0.1:8080 root@129.212.239.28
```

The window will look frozen with no prompt. That's normal, and it means the tunnel is open. Keep it open while you use the page.

**Step 3: Open the page.** In your browser, go to `http://localhost:8080` and fill in:

- **System:** MySQL
- **Server:** `db`
- **Username:** `root`
- **Password:** the value you copied
- **Database:** `waste2goods`

Click the `machine_deposits` table, then "Select data" to see the rows.

**When you're done**, press `Ctrl+C` in the PowerShell window to close the tunnel. To remove Adminer completely, run `docker rm -f adminer` in the droplet.

Don't expose port 8080 or 3306 in the DigitalOcean firewall. A database login page open to the internet is attacked quickly. Also be careful in Adminer, because it connects as root, and an accidental delete or edit changes the live data.

# Human — Nov 20, 2026, 8:00 PM

btw we use docker for pushing idk i forgot

# Claude — Nov 20, 2026, 8:00 PM

Docker doesn't push your code anywhere in your setup. Your code goes to GitHub, and Docker builds it on the droplet. The flow you used today is:

1. **On your PC**, commit and push your changes to GitHub (repo `RyotaIwa/Waste2Goods`):
   ```powershell
   git add .
   git commit -m "describe your change"
   git push
   ```

2. **On the droplet**, pull the code and rebuild:
   ```bash
   ssh root@129.212.239.28
   cd /home/deploy/waste2goods
   sudo -u deploy git pull
   docker compose up -d --build
   docker compose logs --tail=30 api
   ```

`git pull` downloads the new code. `docker compose up -d --build` rebuilds the `api` and `web` images from it and restarts the containers, which is why the site was briefly down earlier. The build takes a few minutes on your 1 vCPU / 2 GB server.

**What's in the droplet's `.env`, not in Git:** passwords, `MACHINE_API_KEY` and similar secrets. A new variable also has to be listed in `docker-compose.yml` under `environment:`, as we did for the machine key, or the container won't see it.

**Database changes** are separate. Rebuilding doesn't create new tables, which is why we ran the `CREATE TABLE` by hand. If you change the schema again, you'll need to run the matching SQL on the droplet.

**Quick reference:**
- Restart without rebuilding: `docker compose restart api`
- See running containers: `docker compose ps`
- See logs: `docker compose logs --tail=50 api`

The `trainmodel` machine program doesn't deploy this way. It runs on your PC and talks to the live site through the API.

# Human — Nov 20, 2026, 8:03 PM

PS C:\Users\USER\Downloads\trainmodel> ssh -N -L 8080:127.0.0.1:8080 root@129.212.239.28
bind [127.0.0.1]:8080: Permission denied

# Claude — Nov 20, 2026, 8:03 PM

Windows won't let your PC use port 8080, and it's usually reserved by another program or by Windows itself. You only need a different port on your PC side. The droplet side stays 8080.

Use 18080 instead:

```powershell
ssh -N -L 18080:127.0.0.1:8080 root@129.212.239.28
```

The window will look frozen with no prompt, which is normal. Keep it open. Then open `http://localhost:18080` in your browser and log in with the same details as before:

- **System:** MySQL
- **Server:** `db`
- **Username:** `root`
- **Password:** the `MYSQL_ROOT_PASSWORD` value
- **Database:** `waste2goods`

If you see another bind error, try a different number such as 18081.

If the page doesn't load, Adminer may not be running yet. Connect with `ssh root@129.212.239.28` and run:

```bash
docker ps --filter name=adminer
```

If it shows nothing, run the `docker run ...` command from Step 1 of my earlier message first.

# Human — Nov 20, 2026, 8:05 PM

git add .
git commit -m "describe your change"
git push
is machine also pushhere or not?

# Claude — Nov 20, 2026, 8:05 PM

Probably not. The two folders are separate on your PC:

- `C:\Users\USER\Downloads\Gamified Recycling Platform Prototype` is the website project (the `packages/` folder with the backend, mobile app, admin panel and kiosk app). Your `git push` sends this to GitHub, and the droplet pulls it.
- `C:\Users\USER\Downloads\trainmodel` is the machine program (`count_bottles.py`, `best.pt`, `.env`). It runs on your PC and talks to the live site through the API, so it isn't part of the website deploy.

I can't see whether `trainmodel` is inside the git repo, so check it with:

```powershell
cd C:\Users\USER\Downloads\trainmodel
git status
```

- If it says `fatal: not a git repository`, it isn't in any repo, and nothing there gets pushed.
- If it shows files, it's a repo, so check where it pushes with `git remote -v`.

If you do want to back up `trainmodel` on GitHub, never push its `.env`, because it holds your machine key. Add a `.gitignore` file in that folder containing:

```
.env
```

If `.env` was already committed in the past, tell me before you push. Anyone who can see the repo would be able to see the key, and you'd need to replace it.

Do the same check in the website project too, with `git status` and `.gitignore`, so its `.env` isn't pushed either.

For a safe backup of `best.pt` (your trained model) without Git, copy the `trainmodel` folder to Google Drive or a USB drive. Skip `.env`, or keep it private.

# Human — Nov 20, 2026, 8:10 PM

anyway unsaon pagkabalo na connect na og makita ang mo takag sa iot

# Claude — Nov 20, 2026, 8:10 PM

Answering in English, as you asked. Remember that the machine only talks to the server when a bottle is deposited. There's no constant "connected" signal, as far as I can see, so you check each step in the chain.

**1. On the machine side (your PC)**

Run `python count_bottles.py`. The program's window or console should show:
- the camera and detections (the video window)
- the Arduino/LCD responding (for example, "Bottle OK! +5 points")
- a message that the deposit was sent. If it shows an error such as `401`, a timeout or a connection error, the send failed.

**2. On the server side, live**

In the droplet, watch the API receive requests as they happen:

```bash
cd /home/deploy/waste2goods
docker compose logs -f api
```

Put a bottle through, and a new line should appear. Press `Ctrl+C` to stop watching. I can't see exactly what `machine-routes.js` logs, so if nothing shows, check the database instead.

**3. In the database (the real proof)**

Each successful send creates a row. In MySQL (or Adminer, using `machine_deposits` then "Select data"):

```sql
SELECT depositId, kioskId, bottles, pointsAwarded, redeemCode, status, createdAt
FROM machine_deposits
ORDER BY createdAt DESC
LIMIT 10;
```

Check these columns:
- `kioskId` is `K-01`, so it came from your machine.
- `bottles` and `pointsAwarded` match what you deposited.
- `createdAt` is the time you ran the test.
- `status` is `unclaimed` until someone redeems the code in the app.

**4. If nothing arrives**

Work through these in order:
- Is the machine program running, and does it show a send error?
- Does `trainmodel\.env` have the live URL and the 64-character key?
- Does the PC have internet access?
- Does the droplet log show a `401`? That means the key doesn't match.

The earlier check from your PC (`Invoke-RestMethod` with `live-test-0001`) is a good way to separate the problems. If that works but the machine doesn't, the issue is in the machine program or its `.env`.

If you'd like a real "machine online" indicator, for example a "last seen" time on the admin panel, that would need a small heartbeat call from the machine and a new field on the server. I can help build that if you want it.

# Human — Nov 20, 2026, 8:10 PM

how about the system can the user redeem ?

# Claude — Nov 20, 2026, 8:10 PM

I'm not sure, and I should correct something I said earlier. I told you to "redeem the code in the app", but I can't see the code of `machine-routes.js` or the mobile app in our chat, so I can't confirm that a redeem screen or claim endpoint exists.

**What is confirmed**
- The machine sends each deposit to the server with a redeem code, and the server saves it in `machine_deposits`.
- The table has the columns needed for redemption: `status` (starts as `unclaimed`), `claimedBy` (the user) and `claimedAt`. That suggests redemption was planned.

**What I can't confirm**
- Whether the backend has an endpoint that takes a code, checks it's unclaimed, adds the points to the user, and marks it claimed.
- Whether the mobile app has a screen where the resident types or scans the code.

**How to check.** In the droplet, run:

```bash
cd /home/deploy/waste2goods
grep -n "router\.\(get\|post\|put\)\|app\.\(get\|post\|put\)" packages/backend/src/machine-routes.js
grep -rn -i "claim" packages/mobile-app/src | head
```

The first command lists the routes in the machine file. If you see something like a `/claim` or `/redeem` route, the server side exists. The second command looks for claim code in the mobile app. Paste both outputs here, and I'll tell you exactly what's missing.

**If it's missing, it's a small job.** It needs two things:
1. A server endpoint (for example, `POST /api/deposits/claim`) that, in one database transaction, finds the unclaimed code, adds the points to the logged-in user, and marks the row claimed. This also stops one code from being redeemed twice.
2. A screen in the mobile app where the resident enters the code.

Until that exists, the code printed on the receipt can't be turned into points inside the app, so I wouldn't present the redemption step as working.

# Human — Nov 20, 2026, 8:20 PM

**Attachment: list.md · blob · 1.8 MB**

can you help me add a feature in my system(front end) na maka redeem ang user sa ge generate na code gikan sa iot?

# Claude — Nov 20, 2026, 8:20 PM

Yes, I can help with this. `list.md` is only a file tree, with no code in it, but it shows where things live:

- **Mobile app (the residents' side):** `packages/mobile-app/src/app/App.tsx`. The whole app is in this one file.
- **Shared API calls:** `packages/core/src/api.ts` and `api.js`
- **Server:** `packages/backend/src/index-mysql.js` and `machine-routes.js`

I don't want to guess how your login, points and screens work, because code that doesn't match could break the app. Please upload these three files:

1. `packages/backend/src/machine-routes.js` (I need to see whether a claim endpoint already exists, and how the deposit is stored)
2. `packages/mobile-app/src/app/App.tsx`
3. `packages/core/src/api.ts`

You can upload them here in the chat.

**What I'll build once I see them**

1. **Server.** A new `POST /api/deposits/claim` endpoint, for logged-in residents only. In one database transaction it:
   - finds the code in `machine_deposits` with status `unclaimed`
   - adds `pointsAwarded` to the user's points
   - sets `status='claimed'`, `claimedBy` and `claimedAt`
   - rejects codes that are unknown or already used, and rate-limits attempts so nobody can guess codes
2. **Shared API.** A `claimDeposit(code)` function in `core/src/api.ts` (and `api.js`).
3. **Mobile app.** A "Redeem code" screen where the resident types the 8-character code from the receipt, shows a success message with the points added, and refreshes their balance. It can show a clear error for a wrong or already-used code.

After that, you commit and push, then pull and rebuild on the droplet, as you did for the machine API. No new database table is needed, because `machine_deposits` already has `claimedBy` and `claimedAt`.

# Human — Nov 20, 2026, 8:22 PM

> **Attachment: attachment · txt · 11.6 KB**
>
> // Bottle-machine integration for Waste2Goods.
> //
> // Put this file in packages/backend/src/ (next to index-mysql.js).
> //
> //   POST /api/machine/transactions   the machine reports a finished transaction (API key)
> //   POST /api/machine/claim          a logged-in resident claims a receipt code (JWT)
> //   GET  /api/machine/deposits       admin list of machine deposits (JWT, admin)
> //
> // Needs the machine_deposits table from migrations/002_add_machine_deposits.sql.
> //
> // Environment variables (server side)
> //   MACHINE_API_KEY            required. Same value as MACHINE_API_KEY in the machine's .env
> //   MACHINE_POINTS_PER_BOTTLE  optional. A fixed number of points per bottle (for example 5).
> //                              If not set, points follow your materials table:
> //                              bottles x kgPerUnit x pointsPerKg
> //   MACHINE_MATERIAL_ID        optional. materialId used for bottles. Default 1
> //   MACHINE_CODE_TTL_DAYS      optional. Days a receipt code stays valid. Default 30, 0 = never expires
> 
> import crypto from 'node:crypto';
> import db from './db-mysql.js';
> import { authenticateJWT, requireRole } from './security/auth-jwt.js';
> import { writeLimiter } from './security/rate-limit.js';
> import { CacheBust } from './security/cache.js';
> import { sanitizeLog } from './security/escape-html.js';
> 
> const ID_RE = /^[A-Za-z0-9_-]{1,50}$/;
> const CODE_RE = /^[A-Z0-9]{8}$/;
> 
> // ── helpers ──────────────────────────────────────────────────────────────
> 
> // Constant-time key check. Hashing first makes both sides the same length.
> function keyMatches(provided, expected) {
>     if (!expected || typeof provided !== 'string' || provided === '') return false;
>     const a = crypto.createHash('sha256').update(provided).digest();
>     const b = crypto.createHash('sha256').update(expected).digest();
>     return crypto.timingSafeEqual(a, b);
> }
> 
> function isWholeNumber(n, min, max) {
>     return Number.isInteger(n) && n >= min && n <= max;
> }
> 
> function parseTransaction(body) {
>     const b = body || {};
>     const transactionId = String(b.transaction_id ?? '');
>     const machineId = String(b.machine_id ?? '');
>     const code = String(b.code ?? '').trim().toUpperCase();
>     const bottles = Number(b.bottles);
>     const points = Number(b.points);
> 
>     if (!ID_RE.test(transactionId)) return { error: 'transaction_id is invalid' };
>     if (!ID_RE.test(machineId)) return { error: 'machine_id is invalid' };
>     if (!CODE_RE.test(code)) return { error: 'code must be 8 letters or digits' };
>     if (!isWholeNumber(bottles, 1, 500)) return { error: 'bottles must be a whole number from 1 to 500' };
>     if (!isWholeNumber(points, 0, 1000000)) return { error: 'points must be a whole number' };
> 
>     // Machine clock is only informational. Ignore anything that is not a sensible date.
>     let machineTime = null;
>     if (b.created_at) {
>         const d = new Date(b.created_at);
>         const yearMs = 365 * 24 * 3600 * 1000;
>         if (!Number.isNaN(d.getTime()) && Math.abs(Date.now() - d.getTime()) < yearMs) machineTime = d;
>     }
>     return { value: { transactionId, machineId, code, bottles, points, machineTime } };
> }
> 
> async function loadMaterial() {
>     const id = Number(process.env.MACHINE_MATERIAL_ID || 1);
>     const [rows] = await db.query(
>         "SELECT materialId, kgPerUnit, pointsPerKg FROM recyclable_materials WHERE materialId = ? AND status = 'active' LIMIT 1",
>         [id]
>     );
>     return rows[0] || null;
> }
> 
> // The server decides the points. The machine's own number is only stored for reference.
> function computePoints(bottles, material) {
>     const raw = process.env.MACHINE_POINTS_PER_BOTTLE;
>     if (raw !== undefined && raw !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0) {
>         return Math.round(bottles * Number(raw));
>     }
>     if (!material) return null;
>     return Math.round(bottles * Number(material.kgPerUnit || 0) * Number(material.pointsPerKg || 0));
> }
> 
> function newTransactionId() {
>     return `RT-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
> }
> 
> // ── POST /api/machine/transactions (called by count_bottles.py) ──────────
> 
> async function recordDeposit(req, res) {
>     const expected = process.env.MACHINE_API_KEY || '';
>     if (!expected) return res.status(503).json({ error: 'Machine API is not configured' });
>     if (!keyMatches(req.get('x-machine-key'), expected)) {
>         return res.status(401).json({ error: 'Invalid machine key' });
>     }
> 
>     const parsed = parseTransaction(req.body);
>     if (parsed.error) return res.status(400).json({ error: parsed.error });
>     const t = parsed.value;
> 
>     try {
>         const [kiosks] = await db.query('SELECT kioskId FROM kiosks WHERE kioskId = ? LIMIT 1', [t.machineId]);
>         if (!kiosks.length) {
>             return res.status(400).json({ error: 'Unknown machine_id: it must exist in the kiosks table' });
>         }
> 
>         const material = await loadMaterial();
>         const pointsAwarded = computePoints(t.bottles, material);
>         if (pointsAwarded === null) {
>             return res.status(500).json({ error: 'Bottle material is not configured on the server' });
>         }
> 
>         try {
>             await db.query(
>                 `INSERT INTO machine_deposits
>            (depositId, kioskId, redeemCode, bottles, pointsReported, pointsAwarded, status, machineTime)
>          VALUES (?, ?, ?, ?, ?, ?, 'unclaimed', ?)`,
>                 [t.transactionId, t.machineId, t.code, t.bottles, t.points, pointsAwarded, t.machineTime]
>             );
>         } catch (err) {
>             if (err?.code !== 'ER_DUP_ENTRY') throw err;
>             // Same transaction sent again (a retry): that is fine. A different transaction with the same code is not.
>             const [same] = await db.query(
>                 'SELECT depositId FROM machine_deposits WHERE depositId = ? AND redeemCode = ? LIMIT 1',
>                 [t.transactionId, t.code]
>             );
>             if (same.length) return res.status(409).json({ status: 'duplicate' });
>             return res.status(422).json({ error: 'Receipt code is already used by another deposit' });
>         }
> 
>         // Show the machine as online in the admin panel. Not critical, so never fail the request.
>         try {
>             await db.query("UPDATE kiosks SET status = 'online', lastPing = 'just now' WHERE kioskId = ?", [t.machineId]);
>             CacheBust.kiosks();
>         } catch { /* ignore */ }
> 
>         console.log(`♻️ Machine deposit saved: ${sanitizeLog(t.machineId)} ${t.bottles} bottles, code ${sanitizeLog(t.code)}`);
>         return res.status(201).json({ ok: true, depositId: t.transactionId, pointsAwarded });
>     } catch (err) {
>         console.error(`[machine] record error: ${sanitizeLog(err?.message || 'unknown')}`);
>         return res.status(500).json({ error: 'Could not save the transaction' });
>     }
> }
> 
> // ── POST /api/machine/claim (resident enters the receipt code) ───────────
> 
> async function claimDeposit(req, res) {
>     const role = req.user?.role;
>     const userId = req.user?.userId;
>     if (role !== 'resident' || !userId) {
>         return res.status(403).json({ error: 'Only a logged-in resident can claim a receipt code' });
>     }
> 
>     const code = String(req.body?.code ?? '').trim().toUpperCase();
>     if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Invalid code' });
> 
>     try {
>         const [rows] = await db.query('SELECT * FROM machine_deposits WHERE redeemCode = ? LIMIT 1', [code]);
>         if (!rows.length) return res.status(404).json({ error: 'Invalid code' });
>         const dep = rows[0];
> 
>         if (dep.status === 'claimed') return res.status(409).json({ error: 'This code was already used' });
>         if (dep.status !== 'unclaimed') return res.status(410).json({ error: 'This code is no longer valid' });
> 
>         const ttlDays = Number(process.env.MACHINE_CODE_TTL_DAYS ?? 30);
>         if (ttlDays > 0 && Date.now() - new Date(dep.createdAt).getTime() > ttlDays * 24 * 3600 * 1000) {
>             return res.status(410).json({ error: 'This code has expired' });
>         }
> 
>         // Claim it in ONE atomic statement. If two people try at once, only one gets affectedRows = 1.
>         const [claim] = await db.query(
>             "UPDATE machine_deposits SET status = 'claimed', claimedBy = ?, claimedAt = NOW() WHERE depositId = ? AND status = 'unclaimed'",
>             [userId, dep.depositId]
>         );
>         if (!claim || claim.affectedRows !== 1) {
>             return res.status(409).json({ error: 'This code was already used' });
>         }
> 
>         const pointsAwarded = Number(dep.pointsAwarded);
>         try {
>             const material = await loadMaterial();
>             const weightKg = Math.round(Number(dep.bottles) * Number(material?.kgPerUnit || 0) * 100) / 100;
>             const materialId = Number(material?.materialId || process.env.MACHINE_MATERIAL_ID || 1);
> 
>             await db.query(
>                 'INSERT INTO recycling_transactions (transactionId, userId, materialId, weightKg, pointsEarned, kioskId, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())',
>                 [newTransactionId(), userId, materialId, weightKg, pointsAwarded, dep.kioskId]
>             );
>             await db.query(
>                 'UPDATE users SET pointsBalance = pointsBalance + ?, totalSubmissions = totalSubmissions + 1 WHERE userId = ?',
>                 [pointsAwarded, userId]
>             );
>         } catch (err) {
>             // Crediting failed: give the code back so the resident can try again.
>             await db.query(
>                 "UPDATE machine_deposits SET status = 'unclaimed', claimedBy = NULL, claimedAt = NULL WHERE depositId = ?",
>                 [dep.depositId]
>             );
>             throw err;
>         }
> 
>         try {
>             await CacheBust.transactions();
>             await CacheBust.users();
>         } catch { /* ignore */ }
> 
>         const [bal] = await db.query('SELECT pointsBalance FROM users WHERE userId = ? LIMIT 1', [userId]);
>         return res.json({
>             ok: true,
>             bottles: Number(dep.bottles),
>             pointsAwarded,
>             newBalance: Number(bal?.[0]?.pointsBalance || 0),
>             message: `+${pointsAwarded} points added to your account`,
>         });
>     } catch (err) {
>         console.error(`[machine] claim error: ${sanitizeLog(err?.message || 'unknown')}`);
>         return res.status(500).json({ error: 'Could not claim the code' });
>     }
> }
> 
> // ── GET /api/machine/deposits (admin) ────────────────────────────────────
> 
> async function listDeposits(req, res) {
>     try {
>         const [rows] = await db.query(`
>       SELECT d.depositId, d.kioskId, d.redeemCode, d.bottles, d.pointsReported, d.pointsAwarded,
>              d.status, d.claimedBy, d.claimedAt, d.createdAt, u.firstName, u.lastName
>       FROM machine_deposits d
>       LEFT JOIN users u ON u.userId = d.claimedBy
>       ORDER BY d.createdAt DESC
>       LIMIT 50
>     `);
>         res.json(rows);
>     } catch (err) {
>         res.status(500).json({ error: err.message });
>     }
> }
> 
> export function attachMachineRoutes(app) {
>     app.post('/api/machine/transactions', writeLimiter, recordDeposit);
>     app.post('/api/machine/claim', authenticateJWT, writeLimiter, claimDeposit);
>     app.get('/api/machine/deposits', authenticateJWT, requireRole('admin'), listDeposits);
> }
> 
> // exported for tests only
> export const machineHandlers = { recordDeposit, claimDeposit, listDeposits, parseTransaction, computePoints };

> **Attachment: attachment · txt · 172.9 KB**
>
> import { useState, useEffect, useRef, useMemo } from "react";
> import { Waste2GoodsAPI, getApiHost, setApiHost as persistApiHost, getApiBaseUrl, testApiConnection, isServerIpPanelEnabled } from "@waste2goods/core";
> import { Html5QrcodeScanner } from "html5-qrcode";
> import {
>   Monitor, Recycle, Home, QrCode, Gift,
>   Target, User, ArrowLeft, AlertCircle, CheckCircle2,
>   RefreshCw, MapPin,
>   Trophy, Medal, Zap,
>   Bell, LogOut,
>   ChevronRight, Shield, Mail, Phone, Leaf,
>   Settings, Lock, Info, Flame, Camera, Globe,
>   ScanLine, Keyboard, Hash, Sparkles, Award, Upload, CheckSquare2, Cable, Wallet, X, Circle, Package,
>   Copy, Check
> } from "lucide-react";
> 
> type MobileScreen =
>   | "splash" | "onboard1" | "onboard2" | "onboard3"
>   | "login" | "register" | "mfa" | "profile-setup"
>   | "home" | "submit" | "submit-scan" | "submit-confirm" | "submit-done"
>   | "rewards" | "redeem-confirm" | "redeem-history"
>   | "tasks" | "profile" | "history" | "settings" | "notifications"
>   | "leaderboard";
> 
> // Default LAN address of the local development backend (offline demo fallback only).
> // This is a private RFC-1918 address (192.168.0.0/16) used as a convenience default for
> // instructor/demo setups on a local network — it is never a production endpoint.
> const DEFAULT_DEV_API_HOST = "192.168.1.164"; // NOSONAR - intentional private-range dev/demo default (typescript:S1313)
> 
> const weeklyData = [
>   { day: "Mon", kg: 42 }, { day: "Tue", kg: 67 }, { day: "Wed", kg: 53 },
>   { day: "Thu", kg: 89 }, { day: "Fri", kg: 74 }, { day: "Sat", kg: 112 }, { day: "Sun", kg: 95 }
> ];
> const monthlyData = [
>   { month: "Jan", collected: 820, users: 210, redeemed: 65 },
>   { month: "Feb", collected: 940, users: 245, redeemed: 80 },
>   { month: "Mar", collected: 1100, users: 290, redeemed: 102 },
>   { month: "Apr", collected: 980, users: 275, redeemed: 89 },
>   { month: "May", collected: 1340, users: 340, redeemed: 134 },
>   { month: "Jun", collected: 1450, users: 380, redeemed: 158 }
> ];
> const wasteTypes = [
>   { name: "PET Plastic", value: 38, color: "#16a34a" },
> ];
> const DEMO_LEADERBOARD_FALLBACK = [
>   { rank: 1, name: "Ana Reyes", barangay: "Cabantian", points: 4820, avatar: "AR", streak: 14 },
>   { rank: 2, name: "Carlo Mendoza", barangay: "Cabantian", points: 3950, avatar: "CM", streak: 9 },
>   { rank: 3, name: "Maria Santos", barangay: "Cabantian", points: 2840, avatar: "MS", streak: 7 },
>   { rank: 4, name: "Jose Dela Cruz", barangay: "Cabantian", points: 2310, avatar: "JD", streak: 5 },
>   { rank: 5, name: "Liza Villareal", barangay: "Cabantian", points: 1990, avatar: "LV", streak: 3 },
>   { rank: 6, name: "Ben Pascual", barangay: "Cabantian", points: 1640, avatar: "BP", streak: 2 },
> ];
> const rewards = [
>   { id: 1, name: "School Supplies Kit", points: 500, cost: 500, category: "Education", stock: 23, icon: "📚", seasonal: false, description: "Complete school essentials set including notebooks, pens, and bag.", delivery: "Barangay Pick-up", validity: "30 Days" },
>   { id: 2, name: "Grocery Voucher ₱100", points: 800, cost: 800, category: "Grocery", stock: 15, icon: "🛒", seasonal: false, description: "₱100 voucher redeemable at all participating local grocery stores.", delivery: "Digital Code", validity: "60 Days" },
>   { id: 3, name: "Eco Water Bottle", points: 350, cost: 350, category: "Lifestyle", stock: 41, icon: "🍶", seasonal: false, description: "BPA-free stainless steel insulated 750ml eco water bottle.", delivery: "Barangay Pick-up", validity: "30 Days" },
>   { id: 4, name: "Rice (5kg)", points: 1200, cost: 1200, category: "Grocery", stock: 8, icon: "🌾", seasonal: false, description: "5kg premium white rice bag for family consumption.", delivery: "Kiosk Pickup", validity: "14 Days" },
>   { id: 5, name: "Plant Seedling Set", points: 250, cost: 250, category: "Garden", stock: 60, icon: "🌱", seasonal: true, description: "Assorted vegetable seedlings set for home gardening.", delivery: "Barangay Pick-up", validity: "14 Days" },
>   { id: 6, name: "Reusable Bag Bundle", points: 180, cost: 180, category: "Lifestyle", stock: 88, icon: "👜", seasonal: false, description: "3x heavy-duty canvas reusable shopping bags.", delivery: "Barangay Pick-up", validity: "60 Days" },
>   { id: 7, name: "Back-to-School Bundle", points: 650, cost: 650, category: "Education", stock: 12, icon: "🎒", seasonal: true, description: "Backpack, water flask, and basic stationery kit.", delivery: "Barangay Pick-up", validity: "30 Days" },
>   { id: 8, name: "Herbal Tea Set", points: 300, cost: 300, category: "Wellness", stock: 35, icon: "🍵", seasonal: true, description: "Organic herbal tea selection with bamboo strainer.", delivery: "Barangay Pick-up", validity: "30 Days" },
> ];
> const tasks = [
>   { id: 1, title: "Submit 2kg of PET bottles", reward: 100, progress: 1.4, goal: 2, unit: "kg", type: "daily", done: false },
>   { id: 2, title: "Visit kiosk 3 days in a row", reward: 150, progress: 2, goal: 3, unit: "days", type: "weekly", done: false },
>   { id: 3, title: "Refer a neighbor", reward: 200, progress: 1, goal: 1, unit: "person", type: "special", done: true },
>   { id: 4, title: "Collect 5kg of cardboard", reward: 120, progress: 5, goal: 5, unit: "kg", type: "weekly", done: true },
>   { id: 5, title: "Submit any 3 material types", reward: 80, progress: 2, goal: 3, unit: "types", type: "daily", done: false },
> ];
> const transactions = [
>   { id: "T-0041", date: "Jun 17, 2026", type: "earn", desc: "PET Plastic · 2.3 kg · K-01", pts: 115 },
>   { id: "T-0040", date: "Jun 16, 2026", type: "earn", desc: "Cardboard · 3.1 kg · K-02", pts: 93 },
>   { id: "T-0039", date: "Jun 15, 2026", type: "redeem", desc: "Eco Water Bottle", pts: -350 },
>   { id: "T-0038", date: "Jun 14, 2026", type: "earn", desc: "Metal Cans · 1.8 kg · K-01", pts: 144 },
>   { id: "T-0037", date: "Jun 13, 2026", type: "bonus", desc: "Weekly Challenge Complete", pts: 150 },
>   { id: "T-0036", date: "Jun 12, 2026", type: "earn", desc: "Glass Bottles · 2.0 kg · K-04", pts: 50 },
> ];
> const kiosks = [
>   { id: "K-01", location: "Cabantian Hall", status: "online", weight: "2.3 kg", submissions: 12, battery: 94, lastPing: "2 min ago", temp: "28°C" },
>   { id: "K-02", location: "Cabantian Elementary School", status: "online", weight: "0.8 kg", submissions: 7, battery: 78, lastPing: "1 min ago", temp: "27°C" },
>   { id: "K-03", location: "Cabantian Market", status: "offline", weight: "—", submissions: 0, battery: 0, lastPing: "3 hrs ago", temp: "—" },
>   { id: "K-04", location: "Cabantian Covered Court", status: "online", weight: "4.1 kg", submissions: 19, battery: 61, lastPing: "just now", temp: "30°C" },
>   { id: "K-05", location: "Cabantian Gym", status: "maintenance", weight: "—", submissions: 0, battery: 45, lastPing: "45 min ago", temp: "—" },
> ];
> 
> const STYLE_WEEKLY_DATA = [
>   { day: "Mon", kg: 42 }, { day: "Tue", kg: 67 }, { day: "Wed", kg: 53 },
>   { day: "Thu", kg: 89 }, { day: "Fri", kg: 74 }, { day: "Sat", kg: 112 }, { day: "Sun", kg: 95 }
> ];
> const BADGE_SUCCESS_CLS = "bg-green-100 text-green-700";
> const BADGE_WARN_CLS = "bg-amber-100 text-amber-700";
> const BADGE_DANGER_BG = "bg-red-50 border border-red-200 text-red-700";
> const BADGE_OK_BG = "bg-green-50 border border-green-200 text-green-700";
> const INPUT_BASE_CLS = "w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
> const BTN_PRIMARY_CLS = "rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors";
> const BTN_SECONDARY_CLS = "rounded-2xl border border-border font-bold text-foreground hover:bg-secondary transition-colors";
> 
> function RankIcon({ rank }: Readonly<{ rank: number }>) {
>   if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
>   if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
>   if (rank === 3) return <Medal className="w-5 h-5 text-amber-500" />;
>   return <span className="text-xs text-muted-foreground font-mono font-bold">#{rank}</span>;
> }
> 
> function StatusPip({ status }: Readonly<{ status: string }>) {
>   const c: Record<string, string> = { online: "bg-emerald-400", offline: "bg-red-400", maintenance: "bg-amber-400", active: "bg-emerald-400", inactive: "bg-gray-300" };
>   return <span className={`inline-block w-3 h-3 rounded-full ${c[status] ?? "bg-gray-300"}`} />;
> }
> 
> function SignalIcon({ className }: Readonly<{ className?: string }>) {
>   return (
>     <svg className={className} viewBox="0 0 16 16" fill="currentColor">
>       <rect x="0" y="9" width="3" height="7" rx="1" /><rect x="4.5" y="6" width="3" height="10" rx="1" />
>       <rect x="9" y="3" width="3" height="13" rx="1" /><rect x="13.5" y="0" width="3" height="16" rx="1" />
>     </svg>
>   );
> }
> 
> function AnimatedNumber({ value, suffix = "", className = "" }: Readonly<{ value: number; suffix?: string; className?: string }>) {
>   return <span className={className}>{value}{suffix}</span>;
> }
> 
> function elapsedFromTs(ts?: number | string | null): string {
>   if (!ts) return "";
>   const diffSec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
>   if (diffSec < 60) return `${diffSec}s ago`;
>   const diffMin = Math.floor(diffSec / 60);
>   if (diffMin < 60) return `${diffMin}m ago`;
>   return `${Math.floor(diffMin / 60)}h ago`;
> }
> 
> function useAnimatedWeight(target: number, running: boolean) {
>   const [val, setVal] = useState(0);
>   useEffect(() => {
>     if (!running) return;
>     const step = target / 40;
>     let cur = 0;
>     const iv = setInterval(() => {
>       cur = Math.min(cur + step, target);
>       setVal(Number.parseFloat(cur.toFixed(2)));
>       if (cur >= target) clearInterval(iv);
>     }, 60);
>     return () => clearInterval(iv);
>   }, [running, target]);
>   return val;
> }
> 
> function Field({
>   label,
>   placeholder,
>   type = "text",
>   icon,
>   value,
>   onChange,
>   defaultValue,
>   defaultVal,
>   containerClassName,
>   inputClassName,
>   id,
> }: Readonly<{
>   label: string;
>   placeholder: string;
>   type?: string;
>   icon?: React.ReactNode;
>   value?: string;
>   onChange?: (value: string) => void;
>   defaultValue?: string;
>   defaultVal?: string;
>   containerClassName?: string;
>   inputClassName?: string;
>   id?: string;
> }>) {
>   const initialValue = value ?? defaultValue ?? defaultVal;
>   const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);
>   return (
>     <div className={containerClassName}>
>       {label ? <label htmlFor={inputId} className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label> : null}
>       <div className="relative">
>         {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</div>}
>         <input
>           id={inputId}
>           type={type}
>           value={initialValue}
>           onChange={(e) => onChange?.(e.target.value)}
>           placeholder={placeholder}
>           className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${inputClassName ?? ""}`}
>         />
>       </div>
>     </div>
>   );
> }
> 
> function SelectField({
>   label,
>   placeholder,
>   icon,
>   value,
>   options,
>   onChange,
>   disabled,
> }: Readonly<{
>   label: string;
>   placeholder: string;
>   icon?: React.ReactNode;
>   value: string;
>   options: string[];
>   onChange: (value: string) => void;
>   disabled?: boolean;
> }>) {
>   return (
>     <div>
>       <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label>
>       <div className="relative">
>         {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">{icon}</div>}
>         <select
>           value={value}
>           disabled={disabled}
>           onChange={(e) => onChange(e.target.value)}
>           className={`w-full ${icon ? "pl-10" : "pl-4"} pr-10 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed`}
>         >
>           <option value="">{placeholder}</option>
>           {options.map((opt) => (
>             <option key={opt} value={opt}>
>               {opt}
>             </option>
>           ))}
>         </select>
>         <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-muted-foreground pointer-events-none" />
>       </div>
>     </div>
>   );
> }
> 
> // ── Functional Redemption (REAL DB writes via POST /api/rewards/redeem) ──
> 
> function patchAuthBalance(newBalance: number) {
>   const AUTH_STORAGE_KEY = "w2g_auth_state";
>   try {
>     const auth = Waste2GoodsAPI.getAuthState();
>     if (auth?.user) {
>       const patchedUser = { ...auth.user, points: Number(newBalance), pointsBalance: Number(newBalance) };
>       const patchedAuth = { ...auth, user: patchedUser, isAuthenticated: true };
>       try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(patchedAuth)); } catch {}
>     }
>   } catch {}
> }
> 
> function getRedeemButtonLabel(loading: boolean, success: any): string {
>   if (loading) return "Processing...";
>   if (success) return "✅ Done — back to Rewards Catalog";
>   return "Confirm Redemption";
> }
> 
> 
> 
> function saveServerIp(apiHost: string, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): string | null {
>   const trimmed = apiHost.trim();
>   if (!trimmed) {
>     onSaved?.({ type: "err", text: "Please enter an IP address or hostname" });
>     return null;
>   }
>   persistApiHost(trimmed);
>   const cleanHost = getApiHost();
>   const url = getApiBaseUrl().replace(/\/api$/, "");
>   onSaved?.({ type: "ok", text: `✅ Server saved: ${url} — setting saved on device.` });
>   return cleanHost;
> }
> 
> function getBackendOrigin(): string {
>   try {
>     const base = getApiBaseUrl();
>     if (base === "/api" || base.startsWith("/")) {
>       return typeof window !== "undefined" && window.location
>         ? window.location.origin
>         : "http://localhost:3001";
>     }
>     if (base.startsWith("http://") || base.startsWith("https://")) {
>       return base.replace(/\/api\/?$/, "");
>     }
>     return "http://localhost:3001";
>   } catch {
>     return "http://localhost:3001";
>   }
> }
> 
> async function testServerIp(apiHost: string, setTesting: (v: boolean) => void, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): Promise<void> {
>   const trimmed = apiHost.trim();
>   if (!trimmed) {
>     onSaved?.({ type: "err", text: "Please enter an IP address first" });
>     return;
>   }
>   setTesting(true);
>   persistApiHost(trimmed);
>   const result = await testApiConnection();
>   onSaved?.({ type: result.ok ? "ok" : "err", text: result.message });
>   setTesting(false);
> }
> 
> function resetServerIp(setApiHost: (v: string) => void, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): void {
>   setApiHost(DEFAULT_DEV_API_HOST);
>   persistApiHost(DEFAULT_DEV_API_HOST);
>   onSaved?.({ type: "ok", text: `Default set to ${DEFAULT_DEV_API_HOST}:3001` });
> }
> 
> function ServerIpPanel({
>   apiHost,
>   setApiHost,
>   onSaved,
>   compact,
> }: Readonly<{
>   apiHost: string;
>   setApiHost: (v: string) => void;
>   onSaved?: (msg: { type: "ok" | "err"; text: string }) => void;
>   compact?: boolean;
> }>) {
>   // Production (waste2goods.site): the API is same-origin — never show the
>   // LAN-IP panel. Local dev (localhost / LAN IP) keeps it for Wi-Fi testing.
>   if (!isServerIpPanelEnabled()) return null;
>   const [testing, setTesting] = useState(false);
>   const save = () => {
>     saveServerIp(apiHost, onSaved);
>   };
>   const test = async () => {
>     await testServerIp(apiHost, setTesting, onSaved);
>   };
>   const resetToDefault = () => {
>     resetServerIp(setApiHost, onSaved);
>   };
>   return (
>     <div className={`rounded-2xl bg-blue-50 border border-blue-200 space-y-2.5 ${compact ? "p-2.5" : "p-4"}`}>
>       <div className="flex items-start gap-2">
>         <Globe className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
>         <div className="flex-1 min-w-0">
>           <p className="text-xs font-black text-blue-800 uppercase tracking-wide">Backend Server IP</p>
>           <p className="text-[11px] text-blue-700 leading-snug">
>             Enter your PC's <strong>LAN IP</strong>. Saved on device — no rebuild after Wi‑Fi changes.
>           </p>
>         </div>
>       </div>
>       <div>
>         <label htmlFor="server-ip-addr-input" className="text-[11px] font-black text-muted-foreground uppercase tracking-wide mb-1 block">PC IP Address</label>
>         <input
>           id="server-ip-addr-input"
>           type="text"
>           value={apiHost}
>           onChange={e => setApiHost(e.target.value)}
>           placeholder="e.g. 192.168.1.100 or localhost"
>           autoCapitalize="none"
>           autoCorrect="off"
>           spellCheck={false}
>           className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
>         />
>         <div className="flex items-center justify-between mt-1 gap-2">
>           <p className="text-[10px] text-blue-600 font-mono truncate min-w-0">→ {getApiBaseUrl()}</p>
>           <button
>             type="button"
>             onClick={resetToDefault}
>             className="text-[10px] font-bold text-blue-700 hover:underline flex-shrink-0 whitespace-nowrap"
>           >
>             Reset to localhost
>           </button>
>         </div>
>       </div>
>       <div className="flex gap-2">
>         <button
>           type="button"
>           onClick={save}
>           className={`flex-1 ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} rounded-xl bg-primary text-white font-black hover:bg-green-700 transition-colors`}
>         >
>           💾 Save IP
>         </button>
>         <button
>           type="button"
>           onClick={test}
>           disabled={testing}
>           className={`flex-1 ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} rounded-xl border border-blue-300 bg-white text-blue-800 font-black disabled:opacity-60 hover:bg-blue-50 transition-colors`}
>         >
>           {testing ? (
>             <span className="inline-flex items-center justify-center gap-1.5">
>               <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing…
>             </span>
>           ) : "🔌 Test"}
>         </button>
>       </div>
>       {!compact && (
>         <div className="rounded-xl bg-white/60 border border-blue-100 p-2.5 text-[11px] text-blue-800 leading-snug space-y-1">
>           <p><strong>💡 Tip:</strong> To find your PC's LAN IP:</p>
>           <ul className="list-disc list-inside space-y-0.5 pl-1">
>             <li>Windows: Open CMD → type <span className="font-mono">ipconfig</span> → look for <strong>IPv4 Address</strong></li>
>             <li>Mac/Linux: Terminal → type <span className="font-mono">ifconfig</span> or <span className="font-mono">ip a</span></li>
>           </ul>
>         </div>
>       )}
>     </div>
>   );
> }
> 
> function renderKioskBadgeBody(checking?: boolean, connected?: boolean, kioskId?: string, elapsedLabel?: string) {
>   if (checking && !connected) {
>     return <span className="truncate">Checking kiosk link…</span>;
>   }
>   if (connected) {
>     return (
>       <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
>         <span>Kiosk linked · <strong className="truncate">{kioskId || "K-01"}</strong></span>
>         {elapsedLabel && (
>           <>
>             <span className="text-green-600/70 font-normal">·</span>
>             <span className="text-[10px] font-semibold text-green-700/80">{elapsedLabel} elapsed</span>
>           </>
>         )}
>         <span className="block w-full text-[10px] font-semibold text-green-700/80 -mt-0.5">
>           You can submit PET plastic at this kiosk
>         </span>
>       </div>
>     );
>   }
>   return <span className="truncate">No kiosk linked — scan the kiosk QR via Submit tab</span>;
> }
> 
> function KioskLinkBadge({
>   connected,
>   kioskId,
>   checking,
>   connectedAt,
>   onDisconnect,
> }: Readonly<{
>   connected: boolean;
>   kioskId?: string;
>   checking?: boolean;
>   connectedAt?: number;
>   onDisconnect?: () => void;
> }>) {
>   const elapsed = connectedAt ? Math.floor((Date.now() - connectedAt) / 1000) : 0;
>   const elapsedLabel = (() => {
>     if (!connectedAt) return "";
>     if (elapsed < 60) return `${elapsed}s`;
>     if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
>     return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
>   })();
>   return (
>     <div
>       className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-2 border text-xs font-bold ${
>         connected ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-border text-muted-foreground"
>       }`}
>     >
>       <Monitor className={`w-4 h-4 flex-shrink-0 ${connected ? "text-green-600" : ""}`} />
>       <div className="flex-1 min-w-0">
>         {renderKioskBadgeBody(checking, connected, kioskId, elapsedLabel)}
>       </div>
>       {checking && <RefreshCw className="w-3 h-3 ml-auto animate-spin flex-shrink-0 opacity-60" />}
>       {connected && !checking && (
>         <>
>           <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Connected" />
>           {onDisconnect && (
>             <button
>               type="button"
>               onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
>               className="ml-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-300 bg-white/60 text-green-800 hover:bg-green-100 transition-colors flex-shrink-0"
>             >
>               Disconnect
>             </button>
>           )}
>         </>
>       )}
>     </div>
>   );
> }
> 
> type MobileUserShape = {
>   id: string; userId: string; name: string; initials: string; email: string; phone: string;
>   barangay: string; barangayName: string; province: string; city: string; streetAddress: string;
>   points: number; submissions: number; redeemed: number; joined: string; createdAt: any;
>   firstName: string; lastName: string; totalKg: number;
> };
> 
> function initialsFromName(name: string, fallback: string) {
>   return (name || fallback)
>     .split(/\s+/)
>     .filter(Boolean)
>     .map((p: string) => p[0])
>     .join("")
>     .toUpperCase()
>     .slice(0, 2);
> }
> 
> function buildCurrentUser(profileUser: any): MobileUserShape {
>   const userObj = profileUser || Waste2GoodsAPI.getAuthState()?.user || null;
>   if (userObj) {
>     const rawName = (userObj.name || `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim()) as string;
>     const fallbackFromFlds = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim();
>     const id = (userObj as any).id || (userObj as any).userId || "";
>     const name = rawName || fallbackFromFlds || (id ? "" : "Guest User");
>     const init = initialsFromName(name || `${userObj.firstName || ""} ${userObj.lastName || ""}`, id ? "U" : "GU");
>     const points = (userObj as any).points ?? (userObj as any).pointsBalance ?? 0;
>     return {
>       id,
>       userId: id,
>       name,
>       initials: init || (id ? "U" : "GU"),
>       email: (userObj as any).email || "",
>       phone: (userObj as any).phone || "",
>       barangay: (userObj as any).barangay || (userObj as any).barangayName || "Cabantian",
>       barangayName: (userObj as any).barangayName || (userObj as any).barangay || "",
>       province: (userObj as any).province || "",
>       city: (userObj as any).city || "",
>       streetAddress: (userObj as any).streetAddress || "",
>       points: Number(points) || 0,
>       submissions: Number((userObj as any).submissions ?? (userObj as any).totalSubmissions ?? 0) || 0,
>       redeemed: Number((userObj as any).redeemed || 0),
>       joined: (userObj as any).joined || "",
>       createdAt: (userObj as any).createdAt || null,
>       firstName: (userObj as any).firstName || "",
>       lastName: (userObj as any).lastName || "",
>       totalKg: Number((userObj as any).totalKg || 0),
>     };
>   }
>   return {
>     id: "", userId: "", name: "", initials: "", email: "", phone: "",
>     barangay: "Cabantian", barangayName: "Cabantian", province: "Davao del Sur", city: "Davao City",
>     streetAddress: "", points: 0, submissions: 0, redeemed: 0, joined: "", createdAt: null,
>     firstName: "", lastName: "", totalKg: 0,
>   };
> }
> 
> function currentUserIdForLeaderboard() {
>   try {
>     const auth = Waste2GoodsAPI.getAuthState()?.user || null;
>     const u = buildCurrentUser(auth);
>     return String(auth?.id || auth?.userId || u.id || u.userId || "").toUpperCase();
>   } catch {
>     return "";
>   }
> }
> 
> function buildMergedLeaderboard(liveLeaderboard: any[] | null, currentUser: MobileUserShape) {
>   const myId = currentUserIdForLeaderboard() || String(currentUser.id || currentUser.userId || "").toUpperCase();
>   const myEmail = String(currentUser.email || "").toLowerCase();
>   const myName = currentUser.name || "You";
> 
>   let list = (liveLeaderboard && liveLeaderboard.length > 0)
>     ? liveLeaderboard.map((u: any, i: number) => {
>         const firstName = u.firstName || "";
>         const lastName = u.lastName || "";
>         const name = (u.name && u.name.trim() !== "") ? u.name : [firstName, lastName].filter(Boolean).join(" ").trim() || u.userId || "Resident";
>         const pts = Number(u.points ?? u.pointsBalance ?? 0);
>         const subs = Number(u.submissions ?? u.totalSubmissions ?? 0);
>         const uid = String(u.userId ?? u.id ?? "").toUpperCase();
>         const uEmail = String(u.email || "").toLowerCase();
>         const isMe = (!!myId && !!uid && uid === myId) || (!!myEmail && !!uEmail && uEmail === myEmail) || (name.toLowerCase() === myName.toLowerCase());
>         const avatarChars = initialsFromName(name, "RU");
>         return {
>           id: uid || `u-${i}`,
>           userId: uid,
>           name,
>           displayName: name,
>           _initials: avatarChars || "RU",
>           avatar: avatarChars || "RU",
>           barangay: u.barangay || u.barangayName || currentUser.barangay || "Cabantian",
>           points: pts,
>           submissions: subs,
>           totalKg: Number(u.totalKg || (subs * 2.3)),
>           streak: Number(u.streak) || (subs > 0 ? Math.min(30, Math.max(1, Math.ceil(subs / 2))) : 1),
>           isMe,
>           _isYou: isMe,
>         };
>       })
>     : DEMO_LEADERBOARD_FALLBACK.map((u: any, i: number) => {
>         const isMe = (u.name.toLowerCase() === myName.toLowerCase()) || (Boolean(u.id) && u.id === currentUser.id);
>         const demoId = u.id || `demo-${u.rank || i + 1}`;
>         return {
>           id: demoId,
>           userId: demoId,
>           name: u.name,
>           displayName: u.name,
>           _initials: u.avatar || "RU",
>           avatar: u.avatar || "RU",
>           barangay: u.barangay || "Cabantian",
>           points: u.points,
>           submissions: 10,
>           totalKg: 23.0,
>           streak: u.streak || 5,
>           isMe,
>           _isYou: isMe,
>         };
>       });
> 
>   // Ensure logged-in user is present in leaderboard
>   const hasMe = list.some(u => u.isMe);
>   if (!hasMe && currentUser.name && currentUser.name !== "Guest User") {
>     const userInitials = currentUser.initials || initialsFromName(currentUser.name, "RU");
>     list.push({
>       id: currentUser.id || "my-user",
>       userId: currentUser.id || "my-user",
>       name: currentUser.name,
>       displayName: currentUser.name,
>       _initials: userInitials,
>       avatar: userInitials,
>       barangay: currentUser.barangay || "Cabantian",
>       points: Number(currentUser.points || 0),
>       submissions: Number(currentUser.submissions || 0),
>       totalKg: Number(currentUser.totalKg || 0),
>       streak: 7,
>       isMe: true,
>       _isYou: true,
>     });
>   }
> 
>   // Sort by points descending and calculate ranks
>   list.sort((a, b) => b.points - a.points);
>   return list.map((u, idx) => ({ ...u, rank: idx + 1 }));
> }
> 
> function MobileBottomNav({ screen, go }: Readonly<{ screen: MobileScreen; go: (s: MobileScreen) => void }>) {
>   const items = [
>     { icon: <Home className="w-5 h-5" />, label: "Home", s: "home" as MobileScreen },
>     { icon: <QrCode className="w-5 h-5" />, label: "Submit", s: "submit" as MobileScreen },
>     { icon: <Gift className="w-5 h-5" />, label: "Rewards", s: "rewards" as MobileScreen },
>     { icon: <Target className="w-5 h-5" />, label: "Tasks", s: "tasks" as MobileScreen },
>     { icon: <User className="w-5 h-5" />, label: "Profile", s: "profile" as MobileScreen },
>   ];
>   return (
>     <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-3 pt-3 flex justify-around z-20" style={{ paddingBottom: "calc(0.75rem + var(--sab))" }}>
>       {items.map(i => (
>         <button type="button" key={i.label} onClick={() => go(i.s)} className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors ${screen === i.s || (i.s === "submit" && ["submit","submit-scan","submit-confirm","submit-done"].includes(screen)) ? "text-primary" : "text-muted-foreground"}`}>
>           {i.icon}
>           <span className="text-xs font-bold">{i.label}</span>
>         </button>
>       ))}
>     </div>
>   );
> }
> 
> // Philippine Location Data: Province → Cities → Barangays (sample subset with Cabantian, Davao)
> const PH_LOCATIONS: Record<string, Record<string, string[]>> = {
>   "Davao del Sur": {
>     "Davao City": ["Cabantian", "Buhangin", "Poblacion", "Matina", "Toril", "Tugbok", "Calinan", "Marilog", "Baguio", "Paquibato"],
>     "Digos City": ["Barangay 1 Pob.", "Barangay 2 Pob.", "San Jose", "San Miguel", "Aplaya"],
>     "Sta. Cruz": ["Poblacion", "Sibulan", "Darong", "Inauayan", "Bato"],
>   },
>   "Metro Manila": {
>     "Quezon City": ["Diliman", "Loyola Heights", "Project 4", "Kamuning", "Commonwealth", "Batasan Hills"],
>     "Manila": ["Sampaloc", "Ermita", "Malate", "Quiapo", "Tondo", "Pasay"],
>     "Makati City": ["Poblacion", "Bel-Air", "San Lorenzo", "Urdaneta", "Forbes Park"],
>     "Taguig City": ["BGC", "Upper Bicutan", "Lower Bicutan", "Hagonoy", "Tuktukan"],
>   },
>   "Cebu": {
>     "Cebu City": ["Lahug", "Cebu Business Park", "Mabolo", "Talamban", "Poblacion Pardo", "San Nicolas"],
>     "Mandaue City": ["Centro", "Canduman", "Maguikay", "Opao", "Tabok"],
>     "Lapu-Lapu City": ["Punta Engaño", "Lapu-Lapu Pob.", "Marigondon", "Mactan"],
>   },
>   "Bukidnon": {
>     "Valencia City": ["Poblacion", "Bagontaas", "Lumbayao", "Batangan", "Guinoyuran"],
>     "Malaybalay City": ["Poblacion", "Sumpong", "Pal-ing", "Linabo", "Casisang"],
>   },
>   "Misamis Oriental": {
>     "Cagayan de Oro": ["Pueblo de Oro", "Liceo", "Divisoria", "Carmen", "Macasandig", "Bulua"],
>   },
>   "South Cotabato": {
>     "General Santos": ["Poblacion", "San Jose", "Calumpang", "Bula", "Conel", "Fatima"],
>   },
>   "Davao de Oro": {
>     "Compostela": ["Poblacion", "San Jose", "Moncado", "Maparat", "Ngan"],
>   },
>   "Davao Oriental": {
>     "Mati City": ["Dahican", "Poblacion", "Sainz", "Macambol", "Badas"],
>   },
>   "Davao del Norte": {
>     "Panabo City": ["Poblacion", "Kasilak", "San Francisco", "Quezon", "Cacao"],
>     "Tagum City": ["Poblacion", "Madaum", "San Agustin", "Apokon", "Liboganon"],
>   },
> };
> 
> const ALPHABETICAL_COLLATOR = new Intl.Collator("en", {
>   sensitivity: "base",
>   caseFirst: "false",
>   numeric: true,
> });
> const alphabeticalCompare = (a: string, b: string) => ALPHABETICAL_COLLATOR.compare(a, b);
> const PROVINCES = Object.keys(PH_LOCATIONS).sort(alphabeticalCompare);
> 
> const UNPROTECTED_SCREENS = new Set<MobileScreen>([
>   "splash", "onboard1", "onboard2", "onboard3",
>   "login", "register", "mfa", "profile-setup",
> ]);
> 
> function isAuthRequiredScreen(screen: MobileScreen) {
>   return !UNPROTECTED_SCREENS.has(screen);
> }
> 
> function isSessionValid() {
>   const auth = Waste2GoodsAPI.getAuthState();
>   return Boolean(auth?.isAuthenticated && auth?.token);
> }
> 
> function formatNotifTimeAgo(t: string) {
>   try {
>     const ms = new Date(t).getTime();
>     if (!ms) return "";
>     const diff = Date.now() - ms;
>     const mins = Math.floor(diff / 60000);
>     if (mins < 1) return "Just now";
>     if (mins < 60) return `${mins}m ago`;
>     const hrs = Math.floor(mins / 60);
>     if (hrs < 24) return `${hrs}h ago`;
>     const days = Math.floor(hrs / 24);
>     if (days < 7) return `${days}d ago`;
>     return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
>   } catch {
>     return "";
>   }
> }
> 
> function notifIconForType(type: string, severity: string) {
>   if (type === "redemption") return <Gift className={`w-4 h-4 ${severity === "danger" ? "text-red-600" : "text-indigo-600"}`} />;
>   if (type === "milestone") return <Trophy className="w-4 h-4 text-amber-600" />;
>   if (type === "task") return <Target className="w-4 h-4 text-primary" />;
>   if (type === "welcome") return <Leaf className="w-4 h-4 text-green-600" />;
>   if (type === "submission") return <Recycle className="w-4 h-4 text-green-700" />;
>   return <Bell className="w-4 h-4 text-muted-foreground" />;
> }
> 
> function notifIconBgClass(type: string) {
>   if (type === "redemption") return "bg-indigo-100";
>   if (type === "milestone") return "bg-amber-100";
>   if (type === "task") return "bg-green-100";
>   if (type === "welcome") return "bg-emerald-100";
>   if (type === "submission") return "bg-lime-100";
>   return "bg-slate-100";
> }
> 
> 
> 
> type RegFormFields = {
>   regFullName: string;
>   regEmail: string;
>   regPassword: string;
>   regConfirmPassword: string;
>   regProvince: string;
>   regCity: string;
>   regBarangay: string;
> };
> 
> function validateRegStep0(fields: RegFormFields): string | null {
>   if (!fields.regFullName || !fields.regEmail || !fields.regPassword || !fields.regConfirmPassword) {
>     return "Please fill in all fields: name, email, phone, password, confirm password";
>   }
>   if (fields.regPassword !== fields.regConfirmPassword) return "Passwords do not match";
>   if (fields.regPassword.length < 6) return "Password must be at least 6 characters";
>   return null;
> }
> 
> function validateRegStep1(fields: Pick<RegFormFields, "regProvince" | "regCity" | "regBarangay">): string | null {
>   if (!fields.regProvince || !fields.regCity || !fields.regBarangay) {
>     return "Please select Province, City/Municipality, and Barangay";
>   }
>   return null;
> }
> 
> function validateRegComplete(fields: RegFormFields): { error: string | null; step?: number } {
>   const step0 = validateRegStep0(fields);
>   if (step0) return { error: step0, step: 0 };
>   const step1 = validateRegStep1(fields);
>   if (step1) return { error: step1, step: 1 };
>   return { error: null };
> }
> 
> function parseRegName(fullName: string) {
>   const names = fullName.trim().split(/\s+/);
>   return { firstName: names[0] || "User", lastName: names.slice(1).join(" ") || "Lastname" };
> }
> 
> function buildProfilePatches(fields: {
>   setFName: string; setLName: string; setFormEmail: string; setPhone: string;
>   setProvince: string; setCity: string; setBrgy: string;
> }) {
>   const patches: Record<string, string> = {};
>   if (fields.setFName) patches.firstName = fields.setFName;
>   if (fields.setLName) patches.lastName = fields.setLName;
>   if (fields.setFormEmail) patches.email = fields.setFormEmail;
>   if (fields.setPhone) patches.phone = fields.setPhone;
>   if (fields.setProvince) patches.province = fields.setProvince;
>   if (fields.setCity) patches.city = fields.setCity;
>   if (fields.setBrgy) patches.barangayName = fields.setBrgy;
>   return patches;
> }
> 
> async function persistProfile(
>   currentUser: MobileUserShape,
>   patches: Record<string, string>,
> ): Promise<boolean> {
>   if (Waste2GoodsAPI.saveProfile) return Waste2GoodsAPI.saveProfile(patches);
>   const userId = currentUser.id || currentUser.userId;
>   const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
>     method: "PUT",
>     headers: {
>       "Content-Type": "application/json",
>       Authorization: `Bearer ${Waste2GoodsAPI.getAuthState()?.token || ""}`,
>     },
>     body: JSON.stringify(patches),
>   });
>   return res.ok;
> }
> 
> function publishQrBridge(decodedText: string, currentUser: MobileUserShape) {
>   const auth = Waste2GoodsAPI.getAuthState();
>   const u = auth?.user || {};
>   const bridgePayload = {
>     user: {
>       id: (u as any).id || (u as any).userId || currentUser.id || "U-001",
>       userId: (u as any).id || (u as any).userId || currentUser.id || "U-001",
>       name: currentUser.name && currentUser.name !== "Guest User"
>         ? currentUser.name
>         : (u as any).name || `${(u as any).firstName || ""} ${(u as any).lastName || ""}`.trim() || "Registered User",
>       firstName: (u as any).firstName,
>       lastName: (u as any).lastName,
>       email: currentUser.email || (u as any).email || "",
>       points: currentUser.points ?? (u as any).pointsBalance ?? 0,
>       pointsBalance: currentUser.points ?? (u as any).pointsBalance ?? 0,
>     },
>     kioskPayload: decodedText,
>     timestamp: Date.now(),
>   };
>   localStorage.setItem("w2g_kiosk_qr_bridge", JSON.stringify(bridgePayload));
>   try {
>     window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge", newValue: JSON.stringify(bridgePayload) }));
>   } catch { /* ignore */ }
>   Waste2GoodsAPI.connectKioskSession?.({
>     userId: bridgePayload.user.id || bridgePayload.user.userId,
>     userName: bridgePayload.user.name,
>     kioskId: decodedText.includes("K-") ? decodedText : "K-01",
>   });
> }
> 
> function mapKioskSessionResponse(
>   res: { connected?: boolean; kioskId?: string; connectedAt?: number } | null,
>   prev: { connected: boolean; kioskId?: string; connectedAt?: number },
> ) {
>   if (!res) return { connected: false } as const;
>   return {
>     connected: !!res.connected,
>     kioskId: res.kioskId,
>     connectedAt: res.connected ? (res.connectedAt ?? prev.connectedAt ?? Date.now()) : undefined,
>   };
> }
> 
> type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
> 
> function validateRegisterStep1(v: { full: string; email: string; phone?: string; pwd: string; confirm: string }, setError: SetState<string>): boolean {
>   setError("");
>   if (!v.full || !v.email || !v.pwd || !v.confirm) {
>     setError("Please fill in all fields: name, email, phone, password, confirm password");
>     return false;
>   }
>   if (v.pwd !== v.confirm) {
>     setError("Passwords do not match");
>     return false;
>   }
>   if (v.pwd.length < 6) {
>     setError("Password must be at least 6 characters");
>     return false;
>   }
>   return true;
> }
> 
> function validateRegisterAddress(v: { province: string; city: string; barangay: string }, setError: SetState<string>): boolean {
>   setError("");
>   if (!v.province || !v.city || !v.barangay) {
>     setError("Please select Province, City/Municipality, and Barangay");
>     return false;
>   }
>   return true;
> }
> 
> function validateRegisterAll(v: { full: string; email: string; pwd: string; confirm: string; province: string; city: string; barangay: string }, setError: SetState<string>, goStep: (n: number) => void): boolean {
>   setError("");
>   if (!v.full || !v.email || !v.pwd) {
>     setError("Please fill in all fields from Step 1");
>     goStep(0);
>     return false;
>   }
>   if (v.pwd !== v.confirm) {
>     setError("Passwords do not match");
>     goStep(0);
>     return false;
>   }
>   if (!v.province || !v.city || !v.barangay) {
>     setError("Please select Province, City, and Barangay in Step 2");
>     goStep(1);
>     return false;
>   }
>   return true;
> }
> 
> function splitFullName(full: string): { firstName: string; lastName: string } {
>   const names = full.trim().split(/\s+/);
>   return { firstName: names[0] || "User", lastName: names.slice(1).join(" ") || "Lastname" };
> }
> 
> function buildQrBridgePayload(authUser: any, currentUser: any, decodedText: string) {
>   const u = authUser || {};
>   const uid = u.id || u.userId || currentUser.id || "U-001";
>   const rawName = currentUser.name && currentUser.name !== "Guest User"
>     ? currentUser.name
>     : (u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Registered User");
>   const pts = currentUser.points ?? u.pointsBalance ?? 0;
>   return {
>     user: {
>       id: uid,
>       userId: uid,
>       name: rawName,
>       firstName: u.firstName,
>       lastName: u.lastName,
>       email: currentUser.email || u.email || "",
>       points: pts,
>       pointsBalance: pts,
>     },
>     kioskPayload: decodedText,
>     timestamp: Date.now(),
>   };
> }
> 
> type RegisterSubmitCtx = Readonly<{
>   full: string;
>   email: string;
>   pwd: string;
>   confirm: string;
>   phone: string;
>   province: string;
>   city: string;
>   barangay: string;
>   street: string;
> }>;
> 
> async function doRegisterSubmit(
>   ctx: RegisterSubmitCtx,
>   setError: SetState<string>,
>   setLoading: SetState<boolean>,
>   setProfileUser: SetState<any>,
>   setRegStep: SetState<number>,
>   go: (s: MobileScreen) => void,
>   targetAfter: MobileScreen,
> ): Promise<void> {
>   const goStep = (n: number) => setRegStep(n);
>   if (!validateRegisterAll(ctx, setError, goStep)) return;
>   const names = splitFullName(ctx.full);
>   try {
>     setLoading(true);
>     const regAuth = await Waste2GoodsAPI.register({
>       firstName: names.firstName,
>       lastName: names.lastName,
>       email: ctx.email,
>       password: ctx.pwd,
>       phone: ctx.phone,
>       province: ctx.province,
>       city: ctx.city,
>       barangayName: ctx.barangay,
>       streetAddress: ctx.street,
>     });
>     if (regAuth?.user) setProfileUser({ ...regAuth.user });
>     setLoading(false);
>     setRegStep(0);
>     go(targetAfter);
>   } catch (e) {
>     setLoading(false);
>     setError(e instanceof Error ? e.message : "Registration failed");
>     setRegStep(0);
>   }
> }
> 
> type MobileAppRouterProps = Readonly<{
>   screen: MobileScreen;
>   leaderTab: "weekly" | "monthly";
>   regStep: number;
>   selectedReward: typeof rewards[number] | null;
>   rewardFilter: string;
>   mfaCode: string[];
>   weighing: boolean;
>   email: string;
>   password: string;
>   loginError: string;
>   loginLoading: boolean;
>   regFullName: string;
>   regEmail: string;
>   regPassword: string;
>   regConfirmPassword: string;
>   regPhone: string;
>   regProvince: string;
>   regCity: string;
>   regBarangay: string;
>   regStreetAddress: string;
>   regLoading: boolean;
>   regError: string;
>   profileUser: any;
>   profileRank: string;
>   profileSaving: boolean;
>   profileBanner: { type: "ok" | "err"; text: string } | null;
>   setFName: string;
>   setLName: string;
>   setFormEmail: string;
>   setPhone: string;
>   setBrgy: string;
>   setCity: string;
>   setProvince: string;
>   notifItems: any[];
>   notifUnread: number;
>   kioskSession: { connected: boolean; kioskId?: string; connectedAt?: number };
>   kioskChecking: boolean;
>   kioskElapsedLabel?: string;
>   apiHost: string;
>   showLoginServer: boolean;
>   loginServerBanner: { type: "ok" | "err"; text: string } | null;
>   weight: any;
>   mfaRefs: React.RefObject<(HTMLInputElement | null)[]>;
>   availableCities: string[];
>   availableBarangays: string[];
>   currentUser: any;
>   mergedLeaderboard: any[];
>   profileSinceLabel: string;
>   rewardCategories: string[];
>   filteredRewards: typeof rewards;
>   setSelectedReward: (r: typeof rewards[number] | null) => void;
>   setRewardFilter: (v: string) => void;
>   setMfaCode: (v: string[]) => void;
>   setEmail: SetState<string>;
>   setPassword: SetState<string>;
>   setRegFullName: SetState<string>;
>   setRegEmail: SetState<string>;
>   setRegPassword: SetState<string>;
>   setRegConfirmPassword: SetState<string>;
>   setRegPhone: SetState<string>;
>   setRegProvince: SetState<string>;
>   setRegCity: SetState<string>;
>   setRegBarangay: SetState<string>;
>   setRegStreetAddress: SetState<string>;
>   setRegError: SetState<string>;
>   setRegStep: SetState<number>;
>   setLeaderTab: SetState<"weekly" | "monthly">;
>   setProfileBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
>   setSetFName: SetState<string>;
>   setSetLName: SetState<string>;
>   setSetFormEmail: SetState<string>;
>   setSetPhone: SetState<string>;
>   setSetBrgy: SetState<string>;
>   setSetCity: SetState<string>;
>   setSetProvince: SetState<string>;
>   setLoginServerBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
>   setApiHost: SetState<string>;
>   handleSaveProfile: () => Promise<void>;
>   handleDisconnectKiosk: () => Promise<void>;
>   onLogin: () => Promise<void>;
>   onRegisterStep1Next: () => void;
>   onRegisterStep2Next: () => void;
>   onRegisterStep3MFA: () => Promise<void>;
>   onRegisterStep3Skip: () => Promise<void>;
>   onToggleLoginServer: () => void;
>   onRewardRedeem: () => Promise<void>;
>   onRewardClose: () => void;
>   onSubmitConfirm: () => void;
>   go: (s: MobileScreen) => void;
> }>;
> 
> function MobileScreens(p: MobileAppRouterProps) {
>   const el = (
>     <div className="relative flex flex-col w-full flex-1 min-h-0" style={{ background: "#f0fdf4" }}>
>       <MobileScreenContent {...p} />
>     </div>
>   );
>   return el;
> }
> 
> function MobileScreenContent(p: MobileAppRouterProps) {
>   const s = p.screen;
>   switch (s) {
>     case "splash": return <ScreenSplash />;
>     case "onboard1": return <ScreenOnboard1 go={p.go} />;
>     case "onboard2": return <ScreenOnboard2 go={p.go} />;
>     case "onboard3": return <ScreenOnboard3 go={p.go} />;
>     case "register":
>       return (
>         <ScreenRegister
>           regStep={p.regStep}
>           regFullName={p.regFullName} regEmail={p.regEmail} regPhone={p.regPhone}
>           regPassword={p.regPassword} regConfirmPassword={p.regConfirmPassword}
>           regProvince={p.regProvince} regCity={p.regCity} regBarangay={p.regBarangay}
>           regStreetAddress={p.regStreetAddress}
>           regError={p.regError} regLoading={p.regLoading}
>           availableCities={p.availableCities} availableBarangays={p.availableBarangays}
>           setRegFullName={p.setRegFullName} setRegEmail={p.setRegEmail} setRegPhone={p.setRegPhone}
>           setRegPassword={p.setRegPassword} setRegConfirmPassword={p.setRegConfirmPassword}
>           setRegProvince={p.setRegProvince} setRegCity={p.setRegCity} setRegBarangay={p.setRegBarangay}
>           setRegStreetAddress={p.setRegStreetAddress} setRegError={p.setRegError}
>           setRegStep={p.setRegStep} go={p.go}
>           onStep1Next={p.onRegisterStep1Next} onStep2Next={p.onRegisterStep2Next}
>           onStep3MFA={p.onRegisterStep3MFA} onStep3Skip={p.onRegisterStep3Skip}
>         />
>       );
>     case "login":
>       return (
>         <ScreenLogin
>           email={p.email} password={p.password} loginError={p.loginError} loginLoading={p.loginLoading}
>           setEmail={p.setEmail} setPassword={p.setPassword}
>           showLoginServer={p.showLoginServer} loginServerBanner={p.loginServerBanner}
>           apiHost={p.apiHost} setApiHost={p.setApiHost}
>           onToggleLoginServer={p.onToggleLoginServer} onLogin={p.onLogin}
>           setLoginServerBanner={p.setLoginServerBanner} go={p.go}
>         />
>       );
>     case "profile-setup": return <ScreenProfileSetup currentUser={p.currentUser} go={p.go} />;
>     case "mfa": return <ScreenMFA mfaCode={p.mfaCode} setMfaCode={p.setMfaCode} mfaRefs={p.mfaRefs} go={p.go} />;
>     case "home": return <ScreenHome {...p} />;
>     case "rewards": return <ScreenRewards {...p} />;
>     case "submit": return <ScreenSubmit go={p.go} screen={s} currentUser={p.currentUser} />;
>     case "submit-scan": return <ScreenSubmitScan />;
>     case "submit-confirm": return <ScreenSubmitConfirm weight={p.weight} weighing={p.weighing} onConfirm={p.onSubmitConfirm} />;
>     case "submit-done": return <ScreenSubmitDone go={p.go} currentUser={p.currentUser} />;
>     case "tasks": return <ScreenTasks {...p} />;
>     case "leaderboard": return <ScreenLeaderboard {...p} />;
>     case "notifications": return <ScreenNotifications {...p} />;
>     case "profile": return <ScreenProfile {...p} />;
>     case "settings": return <ScreenSettings {...p} />;
>     case "history": return <ScreenHistory {...p} />;
>     case "redeem-history": return <ScreenRedeemHistory {...p} />;
>     case "redeem-confirm":
>       return p.selectedReward ? <ScreenRedeemConfirm {...p} onRedeem={p.onRewardRedeem} onClose={p.onRewardClose} /> : <ScreenRewards {...p} />;
>     default:
>       return p.selectedReward ? <ScreenRewardDetail {...p} onClose={p.onRewardClose} onRedeem={p.onRewardRedeem} /> : <ScreenHome {...p} />;
>   }
> }
> 
> function ScreenSplash() {
>   return (
>     <div className="h-full flex flex-col items-center justify-center" style={{ background: "linear-gradient(160deg, #052e16 0%, #166534 45%, #0c4a6e 100%)" }}>
>       <div className="relative">
>         <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center" style={{ boxShadow: "0 0 80px rgba(34,197,94,0.3)" }}>
>           <Recycle className="w-12 h-12 text-white" />
>         </div>
>         <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-400 border-2 border-green-900 flex items-center justify-center">
>           <Leaf className="w-4 h-4 text-green-900" />
>         </div>
>       </div>
>       <h1 className="text-4xl font-black text-white mt-6 tracking-tight">Waste2Goods</h1>
>       <p className="text-green-300 text-sm mt-1 font-semibold">Recycle · Earn · Thrive</p>
>       <div className="mt-12 flex gap-1.5">
>         {[0,1,2].map(i => <div key={`item-${i}`} className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: `${i*0.3}s` }} />)}
>       </div>
>     </div>
>   );
> }
> 
> function ScreenOnboard1({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
>         <div className="w-48 h-48 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(22,163,74,0.15)" }}>
>           <div className="text-8xl">♻️</div>
>         </div>
>         <div className="text-center">
>           <h2 className="text-3xl font-black text-foreground">Recycle for Rewards</h2>
>           <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Bring your plastic bottles, cardboard, and metal cans to any Waste2Goods kiosk and earn points instantly.</p>
>         </div>
>       </div>
>       <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
>         <div className="flex justify-center gap-2">
>           <div className="w-6 h-2 rounded-full bg-primary" /><div className="w-2 h-2 rounded-full bg-muted" /><div className="w-2 h-2 rounded-full bg-muted" />
>         </div>
>         <button type="button" onClick={() => go("onboard2")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Next</button>
>         <button type="button" onClick={() => go("login")} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip</button>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenOnboard2({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
>         <div className="w-48 h-48 rounded-full bg-blue-100 border-4 border-blue-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(14,165,233,0.15)" }}>
>           <div className="text-8xl">🏆</div>
>         </div>
>         <div className="text-center">
>           <h2 className="text-3xl font-black text-foreground">Climb the Leaderboard</h2>
>           <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Compete with neighbors and earn special recognition. Top recyclers win bonus rewards each week.</p>
>         </div>
>       </div>
>       <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
>         <div className="flex justify-center gap-2">
>           <div className="w-2 h-2 rounded-full bg-muted" /><div className="w-6 h-2 rounded-full bg-primary" /><div className="w-2 h-2 rounded-full bg-muted" />
>         </div>
>         <button type="button" onClick={() => go("onboard3")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Next</button>
>         <button type="button" onClick={() => go("login")} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip</button>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenOnboard3({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
>         <div className="w-48 h-48 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(217,119,6,0.15)" }}>
>           <div className="text-8xl">🎁</div>
>         </div>
>         <div className="text-center">
>           <h2 className="text-3xl font-black text-foreground">Redeem Real Rewards</h2>
>           <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Turn points into groceries, load credits, school supplies, and partner vouchers — directly in the app.</p>
>         </div>
>       </div>
>       <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
>         <div className="flex justify-center gap-2">
>           <div className="w-2 h-2 rounded-full bg-muted" /><div className="w-2 h-2 rounded-full bg-muted" /><div className="w-6 h-2 rounded-full bg-primary" />
>         </div>
>         <button type="button" onClick={() => go("register")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Create Account</button>
>         <button type="button" onClick={() => go("login")} className="w-full text-center text-sm font-semibold text-muted-foreground">Already have an account? <span className="text-primary">Sign in</span></button>
>       </div>
>     </div>
>   );
> }
> 
> type ScreenRegisterProps = Readonly<{
>   regStep: number;
>   regFullName: string; regEmail: string; regPhone: string;
>   regPassword: string; regConfirmPassword: string;
>   regProvince: string; regCity: string; regBarangay: string;
>   regStreetAddress: string;
>   regError: string; regLoading: boolean;
>   availableCities: string[]; availableBarangays: string[];
>   setRegFullName: SetState<string>; setRegEmail: SetState<string>; setRegPhone: SetState<string>;
>   setRegPassword: SetState<string>; setRegConfirmPassword: SetState<string>;
>   setRegProvince: SetState<string>; setRegCity: SetState<string>; setRegBarangay: SetState<string>;
>   setRegStreetAddress: SetState<string>; setRegError: SetState<string>;
>   setRegStep: SetState<number>;
>   go: (s: MobileScreen) => void;
>   onStep1Next: () => void;
>   onStep2Next: () => void;
>   onStep3MFA: () => Promise<void>;
>   onStep3Skip: () => Promise<void>;
> }>;
> 
> function ScreenRegister(p: ScreenRegisterProps) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col overflow-y-auto"
>          style={{ paddingTop: "calc(0.5rem + var(--sat))", paddingBottom: "calc(1.5rem + var(--sab))" }}>
>       <div className="px-5 py-3 flex items-center gap-3 border-b border-border bg-white sticky top-0 z-20" style={{ top: "var(--sat)" }}>
>         <button type="button" onClick={() => p.go("onboard3")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <div>
>           <h2 className="text-base font-black text-foreground">Create Account</h2>
>           <div className="flex gap-1 mt-1">
>             {[1,2,3].map(s => <div key={s} className={`h-1 rounded-full transition-all ${p.regStep >= s-1 ? "bg-primary w-8" : "bg-muted w-4"}`} />)}
>           </div>
>         </div>
>       </div>
>       <div className="p-5 md:p-8 flex-1 max-w-xl w-full mx-auto">
>         {p.regStep === 0 && (
>           <div className="space-y-4">
>             <div>
>               <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">Step 1 of 3 — Account Info</p>
>               <div className="space-y-3">
>                 <Field label="Full Name" placeholder="Maria Santos" icon={<User className="w-4 h-4" />} value={p.regFullName} onChange={p.setRegFullName} />
>                 <Field label="Email Address" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.regEmail} onChange={p.setRegEmail} />
>                 <Field label="Phone Number" placeholder="+63 912 345 6789" icon={<Phone className="w-4 h-4" />} value={p.regPhone} onChange={p.setRegPhone} />
>                 <Field label="Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.regPassword} onChange={p.setRegPassword} />
>                 <Field label="Confirm Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.regConfirmPassword} onChange={p.setRegConfirmPassword} />
>               </div>
>             </div>
>             {p.regError && (
>               <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
>                 <AlertCircle className="w-4 h-4" />
>                 <span>{p.regError}</span>
>               </div>
>             )}
>             <button type="button" onClick={p.onStep1Next} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Continue</button>
>             
>             <div className="flex items-center gap-3 pt-2">
>               <div className="flex-1 h-px bg-border" />
>               <span className="text-xs text-muted-foreground font-semibold">or sign up with</span>
>               <div className="flex-1 h-px bg-border" />
>             </div>
> 
>             <button
>               type="button"
>               onClick={() => {
>                 // Direct backend Google OAuth — works without Appwrite configuration
>                 const redirectUri = `${window.location.origin}/`;
>                 window.location.href = `${getApiBaseUrl()}/auth/google?return_to=${encodeURIComponent(redirectUri)}`;
>               }}
>               className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all no-underline"
>             >
>               <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
>                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
>                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
>                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
>                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
>               </svg>
>               <span>Sign up with Google</span>
>             </button>
> 
>             <button
>               type="button"
>               onClick={() => {
>                 const redirectUri = `${window.location.origin}/`;
>                 window.location.href = `${getApiBaseUrl()}/auth/github?return_to=${encodeURIComponent(redirectUri)}`;
>               }}
>               className="w-full py-3 px-4 rounded-2xl border border-slate-900 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all no-underline"
>             >
>               <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
>                 <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
>               </svg>
>               <span>Sign up with GitHub</span>
>             </button>
>           </div>
>         )}
>         {p.regStep === 1 && (
>           <div className="space-y-4">
>             <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 2 of 3 — Community Address</p>
>             {p.regError && (
>               <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
>                 <AlertCircle className="w-4 h-4" />
>                 <span>{p.regError}</span>
>               </div>
>             )}
>             <p className="text-xs text-muted-foreground mb-1">
>               Select your <strong>Province</strong> first — City and Barangay options will auto-filter based on your choice.
>             </p>
>             <SelectField label="Province" placeholder="Select a Province..." icon={<MapPin className="w-4 h-4" />} value={p.regProvince} options={PROVINCES} onChange={(v) => { p.setRegProvince(v); p.setRegCity(""); p.setRegBarangay(""); }} />
>             <SelectField label="City / Municipality" placeholder={p.regProvince ? "Select a City..." : "Select a Province first"} icon={<MapPin className="w-4 h-4" />} value={p.regCity} options={p.availableCities} disabled={!p.regProvince} onChange={(v) => { p.setRegCity(v); p.setRegBarangay(""); }} />
>             <SelectField label="Barangay" placeholder={p.regCity ? "Select a Barangay..." : "Select a City first"} icon={<MapPin className="w-4 h-4" />} value={p.regBarangay} options={p.availableBarangays} disabled={!p.regCity} onChange={p.setRegBarangay} />
>             <Field label="Street / House / Building No." placeholder="e.g. Block 12 Lot 5, Rizal Street or Purok 7" icon={<MapPin className="w-4 h-4" />} value={p.regStreetAddress} onChange={p.setRegStreetAddress} />
>             <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex gap-2">
>               <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
>               <p className="text-xs text-emerald-800 font-semibold">
>                 No Region required. Leaderboards are based on Barangay level only; the street address above is used for delivery of redeemed items.
>               </p>
>             </div>
>             <button type="button" onClick={p.onStep2Next} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Continue</button>
>             <button type="button" onClick={() => p.setRegStep(0)} className="w-full text-center text-sm text-muted-foreground font-semibold">Back</button>
>           </div>
>         )}
>         {p.regStep === 2 && (
>           <div className="space-y-4">
>             <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 3 of 3 — Security</p>
>             <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
>               <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
>               <p className="text-xs text-blue-700 font-semibold leading-relaxed">Enable Multi-Factor Authentication to protect your account and points balance from unauthorized access.</p>
>             </div>
>             {p.regError && (
>               <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
>                 <AlertCircle className="w-4 h-4" />
>                 <span>{p.regError}</span>
>               </div>
>             )}
>             <div className="grid grid-cols-4 gap-3 my-4">
>               {[
>                 { i: "📱", l: "SMS" }, { i: "🔐", l: "Authenticator" },
>                 { i: "📧", l: "Email" }, { i: "🆔", l: "Barangay ID" },
>               ].map((o) => (
>                 <label key={o.l} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${o.l === "SMS" ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
>                   <div className="text-2xl">{o.i}</div>
>                   <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">{o.l}</div>
>                 </label>
>               ))}
>             </div>
>             <button type="button" disabled={p.regLoading} onClick={p.onStep3MFA} className={`w-full py-4 ${BTN_PRIMARY_CLS} disabled:opacity-60`}>
>               {p.regLoading ? "Creating account..." : "Enable MFA & Continue"}
>             </button>
>             <button type="button" disabled={p.regLoading} onClick={p.onStep3Skip} className="w-full text-center text-sm text-muted-foreground font-semibold disabled:opacity-60">Skip for now</button>
>           </div>
>         )}
>       </div>
>     </div>
>   );
> }
> 
> type ScreenLoginProps = Readonly<{
>   email: string; password: string; loginError: string; loginLoading: boolean;
>   setEmail: SetState<string>; setPassword: SetState<string>;
>   showLoginServer: boolean; loginServerBanner: { type: "ok" | "err"; text: string } | null;
>   apiHost: string; setApiHost: SetState<string>;
>   onToggleLoginServer: () => void; onLogin: () => Promise<void>;
>   setLoginServerBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
>   go: (s: MobileScreen) => void;
> }>;
> 
> function ScreenLogin(p: ScreenLoginProps) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col overflow-y-auto"
>          style={{ paddingTop: "calc(0.75rem + var(--sat))", paddingBottom: "calc(1.5rem + var(--sab))" }}>
>       <div className="flex flex-col items-center gap-2 px-8 pt-4 pb-3 shrink-0">
>         <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
>           <Recycle className="w-7 h-7 text-primary" />
>         </div>
>         <h2 className="text-2xl font-black text-foreground">Welcome back!</h2>
>         <p className="text-muted-foreground text-sm text-center">Sign in to your Waste2Goods account</p>
>       </div>
>       <div className="px-6 flex flex-1 flex-col w-full max-w-xl mx-auto space-y-3">
>         <Field label="Email Address" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.email} onChange={p.setEmail} />
>         <Field label="Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.password} onChange={p.setPassword} />
>         <p className="text-right text-xs text-primary font-bold cursor-pointer shrink-0">Forgot Password?</p>
>         {p.loginError && (
>           <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0">
>             <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
>             <span>{p.loginError}</span>
>           </div>
>         )}
>         {isServerIpPanelEnabled() && (
>         <button type="button" onClick={p.onToggleLoginServer} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-bold text-foreground shrink-0">
>           <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Server IP Settings</span>
>           <ChevronRight className={`w-4 h-4 transition-transform ${p.showLoginServer ? "rotate-90" : ""}`} />
>         </button>
>         )}
>         {isServerIpPanelEnabled() && p.showLoginServer && (
>           <div className="space-y-2 shrink-0">
>             {p.loginServerBanner && (
>               <div className={`rounded-xl px-3 py-2 text-xs font-bold ${p.loginServerBanner.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{p.loginServerBanner.text}</div>
>             )}
>             <ServerIpPanel apiHost={p.apiHost} setApiHost={p.setApiHost} onSaved={p.setLoginServerBanner} compact />
>           </div>
>         )}
>         <div className="mt-auto space-y-2.5 pt-2 shrink-0">
>           <button type="button" disabled={p.loginLoading} onClick={p.onLogin} className={`w-full py-3.5 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60 flex items-center justify-center gap-2`}>
>             {p.loginLoading ? "Signing in..." : "Sign In"}
>           </button>
>           
>           <div className="flex items-center gap-3 pt-1">
>             <div className="flex-1 h-px bg-border" />
>             <span className="text-xs text-muted-foreground font-semibold">or sign in with</span>
>             <div className="flex-1 h-px bg-border" />
>           </div>
> 
>           <button
>             type="button"
>             onClick={() => {
>               // Direct backend Google OAuth — works without Appwrite configuration
>               const redirectUri = `${window.location.origin}/`;
>               window.location.href = `${getApiBaseUrl()}/auth/google?return_to=${encodeURIComponent(redirectUri)}`;
>             }}
>             className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all no-underline"
>           >
>             <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
>               <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
>               <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
>               <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
>               <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
>             </svg>
>             <span>Continue with Google</span>
>           </button>
> 
>           <button
>             type="button"
>             onClick={() => {
>               // Direct backend GitHub OAuth — works without Appwrite configuration
>               const redirectUri = `${window.location.origin}/`;
>               window.location.href = `${getApiBaseUrl()}/auth/github?return_to=${encodeURIComponent(redirectUri)}`;
>             }}
>             className="w-full py-3 px-4 rounded-2xl border border-slate-900 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all no-underline"
>           >
>             <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
>               <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
>             </svg>
>             <span>Continue with GitHub</span>
>           </button>
>         </div>
>       </div>
>       <p className="text-center text-xs text-muted-foreground pt-5 shrink-0">New resident? <button type="button" onClick={() => p.go("register")} className="text-primary font-bold">Create account</button></p>
>     </div>
>   );
> }
> 
> function ScreenProfileSetup({ currentUser, go }: Readonly<{ currentUser: any; go: (s: MobileScreen) => void }>) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="px-5 py-3 flex items-center gap-3 border-b border-border bg-white sticky top-0 z-20" style={{ top: "var(--sat)" }}>
>         <button type="button" onClick={() => go("register")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <div>
>           <h2 className="text-base font-black text-foreground">Almost done!</h2>
>           <p className="text-xs text-muted-foreground">Complete your profile to customize your account</p>
>         </div>
>       </div>
>       <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-24">
>         <div className="flex flex-col items-center gap-3">
>           <div className="relative">
>             <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
>               <User className="w-10 h-10 text-primary/40" />
>             </div>
>             <button type="button" className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-white">
>               <Camera className="w-3.5 h-3.5 text-white" />
>             </button>
>           </div>
>           <p className="text-xs text-muted-foreground font-semibold">Upload a profile photo (optional)</p>
>         </div>
>         <Field label="Display Name" placeholder="Your display name" icon={<User className="w-4 h-4" />} defaultVal={currentUser.name && currentUser.name !== "Guest User" ? currentUser.name : ""} />
>         <div>
>           <label htmlFor="profile-bio" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Bio (optional)</label>
>           <textarea id="profile-bio" className={INPUT_BASE_CLS} rows={3} placeholder="I recycle because I care about my community..." />
>         </div>
>         <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex gap-2">
>           <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
>           <p className="text-xs text-emerald-700 font-semibold">Start recycling at a nearby kiosk to earn your first points!</p>
>         </div>
>         <button type="button" onClick={() => go("home")} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Start Recycling!</button>
>       </div>
>     </div>
>   );
> }
> 
> type ScreenMFAProps = Readonly<{ mfaCode: string[]; setMfaCode: (v: string[]) => void; mfaRefs: React.RefObject<(HTMLInputElement | null)[]>; go: (s: MobileScreen) => void; }>;
> function ScreenMFA({ mfaCode, setMfaCode, mfaRefs, go }: ScreenMFAProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 gap-7 overflow-y-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
>         <Shield className="w-8 h-8 text-blue-600" />
>       </div>
>       <div className="text-center">
>         <h2 className="text-2xl font-black text-foreground">Verify Your Phone</h2>
>         <p className="text-sm text-muted-foreground mt-2 leading-relaxed">We sent a 6-digit code to <strong>+63 912 *** 6789</strong>. Enter it below.</p>
>       </div>
>       <div className="flex gap-2">
>         {mfaCode.map((d, i) => (
>           <input key={`mfa-digit-${["one","two","three","four","five","six"][i]}`}
>             ref={el => { mfaRefs.current[i] = el; }}
>             value={d}
>             maxLength={1}
>             onChange={e => {
>               const v = e.target.value.replace(/\D/g, "");
>               if (!v) { setMfaCode(mfaCode.map((c, idx) => idx === i ? "" : c)); return; }
>               const copy = [...mfaCode]; copy[i] = v; setMfaCode(copy);
>               if (v && i < 5) mfaRefs.current[i + 1]?.focus();
>               if (!v && i > 0) mfaRefs.current[i - 1]?.focus();
>             }}
>             onKeyDown={e => { if (e.key === "Backspace" && !mfaCode[i] && i > 0) { mfaRefs.current[i - 1]?.focus(); } }}
>             inputMode="numeric"
>             className={`w-12 h-14 rounded-xl border-2 text-center text-xl font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${mfaCode[i] ? "border-primary bg-primary/5" : "border-border bg-white"}`}
>           />
>         ))}
>       </div>
>       <p className="text-xs text-muted-foreground">Didn't receive a code? <span className="text-primary font-bold">Resend</span></p>
>       <button type="button" onClick={() => go("profile-setup")} className={`w-full max-w-xs py-4 ${BTN_PRIMARY_CLS} text-base`}>Verify & Continue</button>
>     </div>
>   );
> }
> 
> function ScreenSubmit({
>   go,
>   screen,
>   currentUser,
> }: Readonly<{
>   go: (s: MobileScreen) => void;
>   screen: MobileScreen;
>   currentUser: MobileUserShape;
> }>) {
>   const [manualCode, setManualCode] = useState("K-01");
>   const [connecting, setConnecting] = useState(false);
> 
>   const handleConnectKiosk = (code: string) => {
>     const kId = code.trim().toUpperCase() || "K-01";
>     setConnecting(true);
>     publishQrBridge(kId, currentUser);
>     setTimeout(() => {
>       setConnecting(false);
>       go("submit-confirm");
>     }, 600);
>   };
> 
>   const nearbyKiosks = [
>     { id: "K-01", name: "Cabantian Barangay Hall Kiosk", status: "Online", dist: "50m away" },
>     { id: "K-02", name: "Cabantian Elementary School", status: "Online", dist: "320m away" },
>     { id: "K-04", name: "Cabantian Covered Court", status: "Online", dist: "650m away" },
>   ];
> 
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ top: "var(--sat)" }}>
>         <button type="button" onClick={() => go("home")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <div>
>           <h2 className="text-base font-black text-foreground">Submit Recycling</h2>
>           <p className="text-xs text-muted-foreground">Select a kiosk, enter code, or scan QR</p>
>         </div>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-28">
>         {/* Quick Kiosk Selection */}
>         <div className="bg-white p-4 rounded-2xl border border-border space-y-3">
>           <div className="flex items-center justify-between">
>             <p className="text-xs font-black text-foreground uppercase tracking-wide">Quick Connect: Nearby Kiosks</p>
>             <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">● Ready</span>
>           </div>
>           <div className="space-y-2">
>             {nearbyKiosks.map(k => (
>               <button
>                 key={k.id}
>                 type="button"
>                 onClick={() => handleConnectKiosk(k.id)}
>                 className="w-full p-3 rounded-xl border border-border hover:border-primary hover:bg-green-50/50 transition-all flex items-center justify-between text-left"
>               >
>                 <div className="flex items-center gap-3">
>                   <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center font-mono font-black text-xs text-green-800">
>                     {k.id}
>                   </div>
>                   <div>
>                     <p className="text-xs font-black text-foreground">{k.name}</p>
>                     <p className="text-[10px] text-muted-foreground">{k.dist} • {k.status}</p>
>                   </div>
>                 </div>
>                 <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors">
>                   Connect
>                 </span>
>               </button>
>             ))}
>           </div>
>         </div>
> 
>         {/* Manual Kiosk Code Input */}
>         <div className="p-5 rounded-2xl border border-border bg-white space-y-3">
>           <div className="flex items-center gap-3">
>             <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center"><Keyboard className="w-5 h-5" /></div>
>             <div>
>               <p className="font-black text-sm text-foreground">Enter Kiosk Code Manually</p>
>               <p className="text-xs text-muted-foreground">Type the kiosk ID (e.g., K-01, K-02) shown on screen</p>
>             </div>
>           </div>
>           <div className="flex gap-2">
>             <div className="relative flex-1">
>               <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
>               <input
>                 value={manualCode}
>                 onChange={e => setManualCode(e.target.value.toUpperCase())}
>                 placeholder="K-01"
>                 className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border font-mono font-black text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
>               />
>             </div>
>             <button
>               type="button"
>               disabled={connecting || !manualCode.trim()}
>               onClick={() => handleConnectKiosk(manualCode)}
>               className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
>             >
>               {connecting ? "Linking..." : "Link & Weigh"}
>             </button>
>           </div>
>         </div>
> 
>         {/* Camera QR Alternative */}
>         <button type="button" onClick={() => go("submit-scan")} className="w-full text-left p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-3">
>           <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><ScanLine className="w-5 h-5" /></div>
>           <div className="flex-1">
>             <p className="font-black text-xs text-foreground">Or Scan Kiosk QR Code</p>
>             <p className="text-[10px] text-muted-foreground">Optional: Point camera at kiosk screen to connect</p>
>           </div>
>           <ChevronRight className="w-4 h-4 text-muted-foreground" />
>         </button>
> 
>         <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-2.5">
>           <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
>           <p className="text-xs text-blue-700 font-semibold leading-relaxed">Once connected, drop items into the weighing receptacle on the kiosk. Points will calculate and deposit directly to your wallet.</p>
>         </div>
>       </div>
>       <MobileBottomNav screen={screen} go={go} />
>     </div>
>   );
> }
> 
> function ScreenSubmitScan() {
>   return (
>     <div className="min-h-[100dvh] flex flex-col bg-black" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="px-5 py-3 flex items-center gap-3 border-b border-white/10 sticky top-0 z-10" style={{ top: "var(--sat)" }}>
>         <h2 className="text-base font-black text-white flex-1 text-center pr-10">Scan Kiosk QR</h2>
>       </div>
>       <div className="flex-1 relative overflow-hidden flex items-center justify-center">
>         <div id="qr-reader" className="w-full max-w-md" />
>         <div className="absolute inset-0 pointer-events-none">
>           <div className="w-64 h-64 rounded-3xl border-[3px] border-green-400/80 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
>           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64">
>             <div className="h-[3px] w-full bg-green-400 rounded-full animate-pulse" />
>           </div>
>         </div>
>         <p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs text-white/80 font-semibold text-center w-full px-8">Align the QR code within the frame</p>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenSubmitConfirm({ weight, weighing, onConfirm }: Readonly<{ weight: any; weighing: boolean; onConfirm: () => void }>) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ top: "var(--sat)" }}>
>         <h2 className="text-base font-black text-foreground flex-1 text-center pr-10">Weighing Items</h2>
>       </div>
>       <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
>         <div className="relative">
>           <div className="w-56 h-56 rounded-full border-[6px] border-border bg-white flex items-center justify-center" style={{ boxShadow: "inset 0 -8px 32px rgba(0,0,0,0.05), 0 10px 40px rgba(34,197,94,0.1)" }}>
>             <div className="flex flex-col items-center">
>               <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${weighing ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{weighing ? "Measuring..." : "Place items"}</span>
>               <AnimatedNumber value={weight as number} suffix=" kg" className="text-5xl font-black text-foreground mt-3 tracking-tight" />
>               <p className="text-xs text-muted-foreground mt-2">~ <AnimatedNumber value={Math.round((weight as number) * 10)} suffix=" pts earned" className="text-xs font-black text-primary" /></p>
>             </div>
>           </div>
>           {Array.from({ length: 12 }).map((_, i) => (
>             <div key={`item-${i}`} className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-muted-foreground/30 origin-bottom" style={{ transform: `translate(-50%, -100%) rotate(${i * 30}deg) translateY(-108px)` }} />
>           ))}
>         </div>
>         <div className="w-full max-w-md space-y-2">
>           {[
>             { m: "PET Bottle", w: "0.8 kg", p: "+8 pts", c: "bg-blue-50 border-blue-200", ic: "🧴" },
>             { m: "Cardboard", w: "1.2 kg", p: "+12 pts", c: "bg-amber-50 border-amber-200", ic: "📦" },
>             { m: "Aluminum Can", w: "0.3 kg", p: "+3 pts", c: "bg-emerald-50 border-emerald-200", ic: "🥫" },
>           ].map(r => (
>             <div key={r.m} className={`flex items-center gap-3 p-3 rounded-xl border ${r.c}`}>
>               <div className="text-2xl">{r.ic}</div>
>               <div className="flex-1">
>                 <p className="text-xs font-black text-foreground">{r.m}</p>
>                 <p className="text-[10px] text-muted-foreground">{r.w}</p>
>               </div>
>               <p className="text-xs font-black text-primary">{r.p}</p>
>             </div>
>           ))}
>         </div>
>         <div className="w-full max-w-md space-y-3 pt-2">
>           <div className="flex items-center justify-between text-sm px-1">
>             <span className="text-muted-foreground font-semibold">Estimated points</span>
>             <span className="font-black text-primary">+{Math.round((weight as number) * 10)} pts</span>
>           </div>
>           <button type="button" onClick={onConfirm} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Confirm & Earn Points</button>
>         </div>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenSubmitDone({ go, currentUser }: Readonly<{ go: (s: MobileScreen) => void; currentUser: any }>) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 gap-6 overflow-y-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="relative">
>         <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
>           <CheckCircle2 className="w-14 h-14 text-green-500" />
>         </div>
>         <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary border-4 border-white flex items-center justify-center">
>           <Sparkles className="w-4 h-4 text-white" />
>         </div>
>       </div>
>       <div className="text-center space-y-2">
>         <h2 className="text-3xl font-black text-foreground">Points Earned!</h2>
>         <p className="text-5xl font-black text-primary tracking-tight">+23 pts</p>
>         <p className="text-muted-foreground text-sm mt-2">2.3 kg recycled · Thank you, {currentUser.initials}!</p>
>       </div>
>       <div className="w-full max-w-md space-y-3">
>         <div className="rounded-2xl border border-border bg-white p-4 flex items-center gap-4">
>           <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><Trophy className="w-6 h-6 text-green-500" /></div>
>           <div>
>             <p className="text-xs text-muted-foreground font-semibold">New balance</p>
>             <p className="font-black text-foreground">{Number(currentUser.points || 0) + 23} total points</p>
>           </div>
>         </div>
>         <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
>           <Leaf className="w-5 h-5 text-amber-600 flex-shrink-0" />
>           <p className="text-xs text-amber-700 font-semibold leading-relaxed">🌍 You saved ~2.5 kg CO₂ today. Keep going!</p>
>         </div>
>         <button type="button" onClick={() => go("home")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Back to Home</button>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenHome(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <div>
>           <p className="text-xs text-muted-foreground font-semibold">Good morning,</p>
>           <h2 className="text-xl font-black text-foreground">{(p.currentUser.name && p.currentUser.name.trim() !== "") ? `${p.currentUser.name.split(" ")[0]} 👋` : "👋"}</h2>
>         </div>
>         <div className="flex items-center gap-2">
>           <button type="button" onClick={() => p.go("notifications")} className="relative p-2.5 rounded-xl border border-border bg-white hover:bg-secondary transition-colors">
>             <Bell className="w-5 h-5 text-muted-foreground" />
>             {p.notifUnread > 0 && (
>               <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">{p.notifUnread <= 9 ? p.notifUnread : "9+"}</span>
>             )}
>           </button>
>           <button type="button" onClick={() => p.go("profile")} className="w-10 h-10 rounded-full bg-primary text-white font-black text-sm flex items-center justify-center">{p.currentUser.initials}</button>
>         </div>
>       </div>
>       <div className="p-5 space-y-5 overflow-y-auto flex-1 pb-32">
>         <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #166534 0%, #14532d 50%, #0c4a6e 100%)", boxShadow: "0 20px 50px rgba(22,101,52,0.3)" }}>
>           <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
>           <div className="absolute -right-16 bottom-0 w-56 h-56 rounded-full bg-white/5" />
>           <div className="relative">
>             <div className="flex items-center justify-between mb-4">
>               <div>
>                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-200">Points Balance</p>
>                 <h3 className="text-4xl font-black mt-1 tracking-tight">{p.currentUser.points?.toLocaleString()}</h3>
>                 <p className="text-[11px] text-green-200 mt-0.5">{p.profileSinceLabel}</p>
>               </div>
>               <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">{p.profileRank}</span>
>             </div>
>             <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
>               {[
>                 { l: "Recycled", v: `${(p.currentUser.totalKg || 0).toFixed(1)} kg`, i: <Recycle className="w-4 h-4" /> },
>                 { l: "Streak", v: `${p.currentUser.streak || 0} d`, i: <Flame className="w-4 h-4" /> },
>                 { l: "Badges", v: `${p.currentUser.badges || 0}`, i: <Award className="w-4 h-4" /> },
>               ].map(s => (
>                 <div key={s.l} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/5">
>                   <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">{s.i}</div>
>                   <p className="text-sm font-black">{s.v}</p>
>                   <p className="text-[9px] text-green-200 font-bold uppercase tracking-wider">{s.l}</p>
>                 </div>
>               ))}
>             </div>
>           </div>
>         </div>
>         <div className="grid grid-cols-2 gap-3">
>           <button type="button" onClick={() => p.go("submit")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
>             <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3"><Upload className="w-5 h-5 text-primary" /></div>
>             <p className="text-sm font-black text-foreground">Submit Items</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Scan QR at kiosk</p>
>           </button>
>           <button type="button" onClick={() => p.go("rewards")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
>             <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><Gift className="w-5 h-5 text-amber-500" /></div>
>             <p className="text-sm font-black text-foreground">Redeem Rewards</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Spend your points</p>
>           </button>
>           <button type="button" onClick={() => p.go("tasks")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
>             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3"><CheckSquare2 className="w-5 h-5 text-blue-500" /></div>
>             <p className="text-sm font-black text-foreground">Daily Tasks</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Earn bonus points</p>
>           </button>
>           <button type="button" onClick={() => p.go("leaderboard")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
>             <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3"><Trophy className="w-5 h-5 text-purple-500" /></div>
>             <p className="text-sm font-black text-foreground">Leaderboard</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Top barangay recyclers</p>
>           </button>
>         </div>
>         {p.kioskSession.connected && (
>           <button type="button" onClick={p.handleDisconnectKiosk} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors">
>             <div className="flex items-center gap-3">
>               <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center"><Cable className="w-4 h-4 text-emerald-900" /></div>
>               <div className="text-left">
>                 <p className="text-xs font-black">Linked to {p.kioskSession.kioskId || "kiosk"}</p>
>                 <p className="text-[10px] text-emerald-700 font-semibold">{p.kioskElapsedLabel || "Active session"}{p.kioskChecking ? " · checking..." : ""}</p>
>               </div>
>             </div>
>             <span className="text-[10px] font-bold bg-emerald-400 text-emerald-900 px-2 py-1 rounded-full">Tap to disconnect</span>
>           </button>
>         )}
>         <div className="space-y-3">
>           <div className="flex items-center justify-between">
>             <div>
>               <p className="text-sm font-black text-foreground">Community Leaderboard</p>
>               <p className="text-[10px] text-muted-foreground font-semibold">Top residents &amp; your barangay rank</p>
>             </div>
>             <button type="button" onClick={() => p.go("leaderboard")} className="text-xs font-bold text-primary hover:underline">
>               View all ({p.mergedLeaderboard.length}) →
>             </button>
>           </div>
> 
>           <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-xs divide-y divide-border">
>             {/* Top 3 Residents */}
>             {p.mergedLeaderboard.slice(0, 3).map((u: any, i: number) => {
>               const isYou = u._isYou || u.isMe;
>               return (
>                 <div key={u.id || u.userId || `top-${i}`} className={`flex items-center gap-3 px-4 py-3 ${isYou ? "bg-green-50/70" : ""}`}>
>                   <RankIcon rank={i + 1} />
>                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ${isYou ? "bg-primary text-white ring-2 ring-primary/30" : "bg-gradient-to-br from-primary to-emerald-600 text-white"}`}>
>                     {u._initials}
>                   </div>
>                   <div className="flex-1 min-w-0">
>                     <div className="flex items-center gap-1.5">
>                       <p className="text-sm font-black text-foreground truncate">{u.displayName}</p>
>                       {isYou && <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>}
>                     </div>
>                     <p className="text-[10px] text-muted-foreground font-semibold">{u.barangay || "Cabantian"} · Level {Math.floor(Number(u.points || 0) / 500) + 1}</p>
>                   </div>
>                   <div className="text-right">
>                     <p className="text-sm font-black text-primary">{Number(u.points || 0).toLocaleString()} pts</p>
>                     <p className="text-[10px] text-muted-foreground">{(u.totalKg || 0).toFixed(1)} kg</p>
>                   </div>
>                 </div>
>               );
>             })}
> 
>             {/* If current user is not in top 3, show their row pinned below */}
>             {(() => {
>               const myEntry = p.mergedLeaderboard.find((u: any) => u._isYou || u.isMe);
>               if (myEntry && myEntry.rank > 3) {
>                 return (
>                   <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-primary/20">
>                     <span className="w-6 text-center text-xs font-black text-primary font-mono">#{myEntry.rank}</span>
>                     <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ring-2 ring-primary/30">
>                       {myEntry._initials}
>                     </div>
>                     <div className="flex-1 min-w-0">
>                       <div className="flex items-center gap-1.5">
>                         <p className="text-sm font-black text-foreground truncate">{myEntry.displayName}</p>
>                         <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>
>                       </div>
>                       <p className="text-[10px] text-primary font-semibold">{myEntry.barangay || "Cabantian"} · Your Current Standing</p>
>                     </div>
>                     <div className="text-right">
>                       <p className="text-sm font-black text-primary">{Number(myEntry.points || 0).toLocaleString()} pts</p>
>                       <p className="text-[10px] text-muted-foreground">{(myEntry.totalKg || 0).toFixed(1)} kg</p>
>                     </div>
>                   </div>
>                 );
>               }
>               return null;
>             })()}
>           </div>
>         </div>
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenRewards(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <div>
>           <p className="text-xs text-muted-foreground font-semibold">Points: <span className="text-primary font-black">{p.currentUser.points?.toLocaleString()}</span></p>
>           <h2 className="text-xl font-black text-foreground">Rewards Catalog</h2>
>         </div>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
>         <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
>           {p.rewardCategories.map(c => (
>             <button type="button" key={c} onClick={() => p.setRewardFilter(c)} className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${p.rewardFilter === c ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{c}</button>
>           ))}
>         </div>
>         <div className="grid grid-cols-2 gap-3">
>           {p.filteredRewards.map(r => {
>             const canRedeem = (Number(p.currentUser.points || 0) >= r.cost);
>             const cls = canRedeem ? "bg-primary text-white" : "bg-muted text-muted-foreground";
>             return (
>               <button
>                 type="button"
>                 key={r.name}
>                 onClick={() => p.setSelectedReward(r)}
>                 className={`rounded-2xl border bg-white text-left overflow-hidden transition-all hover:shadow-md cursor-pointer ${
>                   canRedeem ? "border-green-200 hover:border-primary ring-1 ring-green-100" : "border-border hover:border-muted-foreground/40"
>                 }`}
>               >
>                 <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center text-5xl">
>                   <div className="text-5xl">{r.icon}</div>
>                   {r.seasonal && <div className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">⭐ Seasonal</div>}
>                 </div>
>                 <div className="p-3 space-y-1.5">
>                   <p className="text-sm font-black text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">{r.name}</p>
>                   <div className="flex items-center justify-between pt-1">
>                     <span className={`font-black px-2.5 py-1 rounded-full ${cls}`}>{r.cost} pts</span>
>                     <span className="text-[10px] text-muted-foreground font-bold capitalize">{r.category}</span>
>                   </div>
>                 </div>
>               </button>
>             );
>           })}
>         </div>
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>       {p.selectedReward && (
>         <ScreenRewardDetail {...p} onClose={p.onRewardClose} onRedeem={p.onRewardRedeem} />
>       )}
>     </div>
>   );
> }
> 
> type DetailProps = MobileAppRouterProps & Readonly<{ onClose: () => void; onRedeem: () => Promise<void> }>;
> function ScreenRewardDetail(p: DetailProps) {
>   const r = p.selectedReward!;
>   const canRedeem = Number(p.currentUser.points || 0) >= r.cost;
>   return (
>     <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
>       <div className="w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 duration-300">
>         <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
>           <div className="text-[8rem]">{r.icon}</div>
>           <button type="button" onClick={p.onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-border flex items-center justify-center"><X className="w-5 h-5 text-foreground" /></button>
>           {r.seasonal && <div className="absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">⭐ Limited Seasonal</div>}
>         </div>
>         <div className="p-6 space-y-4 overflow-y-auto">
>           <div className="flex items-start justify-between gap-3">
>             <div>
>               <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{r.category}</p>
>               <h2 className="text-2xl font-black text-foreground mt-1 leading-tight">{r.name}</h2>
>             </div>
>             <span className="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary text-white font-black">{r.cost} pts</span>
>           </div>
>           <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
>           <div className="grid grid-cols-3 gap-2 text-center">
>             {[
>               { l: "Stock", v: r.stock }, { l: "Delivery", v: r.delivery }, { l: "Validity", v: r.validity },
>             ].map(s => (
>               <div key={s.l} className="rounded-xl border border-border bg-white p-3">
>                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.l}</p>
>                 <p className="text-xs font-black text-foreground mt-1">{s.v}</p>
>               </div>
>             ))}
>           </div>
>           <div className={`rounded-2xl p-4 flex items-center gap-3 ${canRedeem ? BADGE_OK_BG : BADGE_DANGER_BG}`}>
>             <Wallet className={`w-5 h-5 ${canRedeem ? "text-green-700" : "text-red-700"}`} />
>             <div>
>               <p className="text-xs font-black">{canRedeem ? "✅ You have enough points" : "⚠️ Need more points"}</p>
>               <p className="text-[10px] font-semibold mt-0.5">{canRedeem ? `Balance after redeem: ${(Number(p.currentUser.points || 0) - r.cost).toLocaleString()} pts` : `Short by ${(r.cost - Number(p.currentUser.points || 0)).toLocaleString()} pts — submit more recycling!`}</p>
>             </div>
>           </div>
>           <div className="grid grid-cols-2 gap-3 pt-2">
>             <button type="button" onClick={p.onClose} className={`py-4 ${BTN_SECONDARY_CLS} text-base`}>Close</button>
>             <button type="button" disabled={!canRedeem} onClick={p.onRedeem} className={`py-4 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60`}>Redeem Now</button>
>           </div>
>         </div>
>       </div>
>     </div>
>   );
> }
> 
> function getTaskTypeBadgeClass(type: string): string {
>   if (type === "daily") return "bg-blue-100 text-blue-700";
>   if (type === "weekly") return "bg-purple-100 text-purple-700";
>   return "bg-amber-100 text-amber-700";
> }
> 
> function ScreenTasks(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <h2 className="text-xl font-black text-foreground flex-1">Daily Tasks</h2>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
>         <div className="rounded-2xl p-4 border border-border bg-white">
>           <div className="flex items-center justify-between mb-2">
>             <p className="text-sm font-black text-foreground">Daily progress</p>
>             <p className="text-xs font-black text-primary">3 of 5</p>
>           </div>
>           <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: "60%" }} /></div>
>           <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Complete 5 tasks to unlock <strong>+100 bonus pts</strong></p>
>         </div>
>         {[
>           { t: "Submit 1kg of recyclables", pts: "+50 pts", type: "daily", p: "daily", d: true },
>           { t: "Use app 3 days in a row", pts: "+25 pts", type: "daily", p: "daily", d: true },
>           { t: "Invite 1 neighbor", pts: "+100 pts", type: "daily", p: "daily", d: false },
>           { t: "Attend barangay event", pts: "+200 pts", type: "weekly", p: "weekly", d: false },
>           { t: "Redeem 1 reward", pts: "+75 pts", type: "monthly", p: "monthly", d: false },
>         ].map((t, i) => (
>           <div key={t.t} className="rounded-2xl border border-border bg-white p-4 flex items-center gap-4">
>             <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.d ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"}`}>{t.d ? <CheckSquare2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}</div>
>             <div className="flex-1 min-w-0">
>               <p className="text-sm font-black text-foreground">{t.t}</p>
>               <div className="flex items-center gap-1.5 mt-1">
>                 <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${getTaskTypeBadgeClass(t.type)}`}>{t.p}</span>
>                 <span className="text-xs font-black text-primary">{t.pts}</span>
>               </div>
>             </div>
>             <button type="button" disabled={t.d} className={`px-3 py-1.5 rounded-xl text-xs font-black ${t.d ? "bg-green-500 text-white cursor-default" : [BTN_PRIMARY_CLS, "px-3 py-1.5 text-xs"].join(" ")}`}>{t.d ? "Done" : "Start"}</button>
>           </div>
>         ))}
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenLeaderboard(p: MobileAppRouterProps) {
>   const [viewMode, setViewMode] = useState<"top" | "all">("top");
>   const myUserInLeaderboard = p.mergedLeaderboard.find((u: any) => u._isYou || u.isMe) || {
>     rank: p.profileRank || "#-",
>     displayName: p.currentUser.name || "You",
>     points: p.currentUser.points || 0,
>     barangay: p.currentUser.barangay || "Cabantian",
>     _initials: p.currentUser.initials || "U",
>   };
> 
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 bg-background border-b border-border" style={{ paddingTop: "calc(0.5rem + var(--sat))" }}>
>         <div className="px-5 py-3 flex items-center justify-between">
>           <div>
>             <h2 className="text-xl font-black text-foreground">🏆 Community Leaderboard</h2>
>             <p className="text-xs text-muted-foreground mt-0.5">Top residents &amp; community recyclers in <strong>{p.currentUser.barangay || "Cabantian"}</strong></p>
>           </div>
>           <button
>             type="button"
>             onClick={() => setViewMode(v => v === "top" ? "all" : "top")}
>             className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
>           >
>             {viewMode === "top" ? "Show Full Community" : "Show Top Podium"}
>           </button>
>         </div>
>         <div className="flex border-b border-border px-5">
>           {(["weekly","monthly"] as const).map(t => (
>             <button type="button" key={t} onClick={() => p.setLeaderTab(t)} className={`px-4 py-2 text-xs font-black capitalize transition-colors relative ${p.leaderTab === t ? "text-primary" : "text-muted-foreground"}`}>
>               {t} Ranking
>               {p.leaderTab === t && <div className="absolute left-3 right-3 -bottom-px h-0.5 bg-primary rounded-full" />}
>             </button>
>           ))}
>         </div>
>       </div>
> 
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
>         {/* Pinned Your Standing Card */}
>         <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
>           <div className="flex items-center gap-3">
>             <div className="w-11 h-11 rounded-full bg-white text-green-800 font-black flex items-center justify-center text-sm shadow-xs border-2 border-green-200">
>               {myUserInLeaderboard._initials}
>             </div>
>             <div>
>               <p className="text-[10px] font-bold uppercase tracking-wider text-green-200">Your Current Standing</p>
>               <p className="text-sm font-black text-white">{myUserInLeaderboard.displayName} (You)</p>
>               <p className="text-[11px] text-green-200">{myUserInLeaderboard.barangay || "Cabantian"} · Level {Math.floor(Number(myUserInLeaderboard.points || 0) / 500) + 1}</p>
>             </div>
>           </div>
>           <div className="text-right">
>             <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-black">Rank #{myUserInLeaderboard.rank}</span>
>             <p className="text-base font-black text-green-100 mt-1">{Number(myUserInLeaderboard.points || 0).toLocaleString()} pts</p>
>           </div>
>         </div>
> 
>         {/* Top 3 Podium (when in Top mode) */}
>         {viewMode === "top" && p.mergedLeaderboard.length >= 3 && (
>           <div className="space-y-3">
>             <div className="flex items-center justify-between">
>               <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Top Residents</p>
>               <span className="text-[10px] font-bold text-primary">🥇 Podium Highlights</span>
>             </div>
>             <div className="grid grid-cols-3 gap-2 items-end">
>               {[
>                 { r: 2, u: p.mergedLeaderboard[1], c: "from-slate-100 to-slate-200 border-slate-300", h: "h-32", pl: "🥈" },
>                 { r: 1, u: p.mergedLeaderboard[0], c: "from-amber-100 to-amber-200 border-amber-300", h: "h-40", pl: "🏆" },
>                 { r: 3, u: p.mergedLeaderboard[2], c: "from-orange-100 to-orange-200 border-orange-300", h: "h-28", pl: "🥉" },
>               ].map(pod => (
>                 <div key={pod.r} className={`rounded-2xl border bg-gradient-to-b ${pod.c} p-3 flex flex-col items-center justify-end ${pod.h} relative shadow-xs`}>
>                   {pod.u && (
>                     <>
>                       <div className="absolute -top-4 text-3xl">{pod.pl}</div>
>                       <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-black text-sm border-2 border-white shadow-sm mb-1.5">{pod.u._initials}</div>
>                       <p className="text-xs font-black text-foreground text-center truncate w-full">{pod.u._isYou ? `${pod.u.displayName} (You)` : pod.u.displayName}</p>
>                       <p className="text-[10px] font-black text-primary mt-0.5">{Number(pod.u.points || 0).toLocaleString()} pts</p>
>                     </>
>                   )}
>                 </div>
>               ))}
>             </div>
>           </div>
>         )}
> 
>         {/* Full Community List */}
>         <div className="space-y-2">
>           <div className="flex items-center justify-between">
>             <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Community Rankings</p>
>             <span className="text-[10px] text-muted-foreground font-semibold">{p.mergedLeaderboard.length} Residents</span>
>           </div>
> 
>           <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-xs">
>             {p.mergedLeaderboard.map((u: any, i: number) => {
>               const isYou = u._isYou || u.isMe;
>               return (
>                 <div
>                   key={u.id || u.userId || `leader-${i}`}
>                   className={`flex items-center gap-3 px-4 py-3 transition-colors ${
>                     i !== p.mergedLeaderboard.length - 1 ? "border-b border-border" : ""
>                   } ${isYou ? "bg-green-50/80 ring-1 ring-inset ring-green-200" : ""}`}
>                 >
>                   <RankIcon rank={u.rank || i + 1} />
>                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ${isYou ? "bg-primary text-white ring-2 ring-primary/30" : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"}`}>
>                     {u._initials}
>                   </div>
>                   <div className="flex-1 min-w-0">
>                     <div className="flex items-center gap-1.5">
>                       <p className="text-sm font-black text-foreground truncate">{u.displayName}</p>
>                       {isYou && <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>}
>                     </div>
>                     <p className="text-[10px] text-muted-foreground font-semibold">{u.barangay || "Cabantian"} · Level {Math.floor(Number(u.points || 0) / 500) + 1}</p>
>                   </div>
>                   <div className="text-right">
>                     <p className="text-sm font-black text-primary">{Number(u.points || 0).toLocaleString()} pts</p>
>                     <p className="text-[10px] text-muted-foreground">{(u.totalKg || 0).toFixed(1)} kg</p>
>                   </div>
>                 </div>
>               );
>             })}
>           </div>
>         </div>
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenNotifications(p: MobileAppRouterProps) {
>   const items = p.notifItems.length > 0 ? p.notifItems : [
>     { title: "+23 Points Earned", desc: "You recycled 2.3 kg at Kiosk 01", time: "2h ago", i: "🎁", c: "bg-green-50 border-green-200", unread: true },
>     { title: "New Weekly Task", desc: "Submit 1kg to unlock bonus 50 points", time: "8h ago", i: "📋", c: "bg-blue-50 border-blue-200", unread: true },
>     { title: "Seasonal Reward: Christmas Grocery", desc: "Now available in the catalog!", time: "1d ago", i: "🎄", c: "bg-red-50 border-red-200", unread: false },
>     { title: "Welcome to Waste2Goods!", desc: "+50 bonus points for completing onboarding", time: "3d ago", i: "🎉", c: "bg-amber-50 border-amber-200", unread: false },
>   ];
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <h2 className="text-xl font-black text-foreground">Notifications</h2>
>         <p className="text-xs font-bold text-muted-foreground">{p.notifUnread || 0} unread</p>
>       </div>
>       <div className="p-5 space-y-3 overflow-y-auto flex-1 pb-32">
>         {items.map((n: any) => (
>           <div key={String(n.id ?? n.title)} className={`rounded-2xl p-4 flex items-start gap-4 border ${n.c}`}>
>             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl flex-shrink-0 border border-white shadow-sm">{n.i}</div>
>             <div className="flex-1 min-w-0">
>               <div className="flex items-start justify-between gap-2">
>                 <p className="text-sm font-black text-foreground">{n.title}</p>
>                 {n.unread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
>               </div>
>               <p className="text-xs text-foreground/80 mt-0.5">{n.desc}</p>
>               <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold">{n.time}</p>
>             </div>
>           </div>
>         ))}
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenProfile(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="relative overflow-hidden" style={{ paddingTop: "calc(0.5rem + var(--sat))", background: "linear-gradient(135deg, #166534 0%, #14532d 50%, #0c4a6e 100%)" }}>
>         <div className="absolute inset-0 opacity-20">
>           <div className="absolute -right-20 top-0 w-64 h-64 rounded-full bg-white/20" />
>           <div className="absolute -left-10 -bottom-20 w-80 h-80 rounded-full bg-green-400/20" />
>         </div>
>         <div className="relative px-5 py-4 flex items-center justify-between z-10">
>           <h2 className="text-lg font-black text-white">My Profile</h2>
>           <div className="flex gap-2">
>             <button type="button" onClick={() => p.go("settings")} className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white"><Settings className="w-4 h-4" /></button>
>             <button type="button" onClick={() => { Waste2GoodsAPI.logout(); p.go("login"); }} className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white" title="Sign out"><LogOut className="w-4 h-4" /></button>
>           </div>
>         </div>
>         <div className="relative z-10 px-5 pb-8 flex items-end gap-4">
>           <div className="relative">
>             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur flex items-center justify-center border-2 border-white/30">
>               <span className="text-white text-2xl font-black">{p.currentUser.initials}</span>
>             </div>
>             <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center"><Camera className="w-3.5 h-3.5 text-white" /></div>
>           </div>
>           <div className="flex-1 pb-1 min-w-0">
>             <p className="text-lg font-black text-white truncate">{p.currentUser.name || "Guest User"}</p>
>             <p className="text-xs text-green-200 font-semibold mt-0.5">Level {p.currentUser.level || 1} Recycler · {p.profileRank}</p>
>             <div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-green-100">{p.profileSinceLabel}</span></div>
>           </div>
>         </div>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32 -mt-4">
>         <div className="rounded-3xl bg-white border border-border p-4 -mt-4 relative shadow-sm">
>           <div className="grid grid-cols-4 gap-2 text-center">
>             {[
>               { l: "Points", v: Number(p.currentUser.points || 0).toLocaleString(), c: "text-primary" },
>               { l: "Recycled", v: `${(p.currentUser.totalKg || 0).toFixed(1)}kg`, c: "text-emerald-600" },
>               { l: "Streak", v: `${p.currentUser.streak || 0}d`, c: "text-orange-600" },
>               { l: "Badges", v: `${p.currentUser.badges || 0}`, c: "text-blue-600" },
>             ].map(s => (
>               <div key={s.l} className="flex flex-col items-center gap-0.5 py-2">
>                 <p className={`text-lg font-black ${s.c} leading-none`}>{s.v}</p>
>                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{s.l}</p>
>               </div>
>             ))}
>           </div>
>         </div>
>         <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
>           <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Recent activity</p>
>           {[
>             { t: "Recycled PET bottles", v: "+8 pts", sub: "K-01 · 2h ago", i: "🧴", c: "bg-blue-50" },
>             { t: "Redeemed: P50 Load", v: "-500 pts", sub: "Today · 9:12 AM", i: "📱", c: "bg-purple-50" },
>             { t: "Daily streak", v: "+25 pts", sub: "3 days in a row!", i: "🔥", c: "bg-orange-50" },
>             { t: "Level 2 Milestone", v: "+100 pts", sub: "2 days ago", i: "⭐", c: "bg-amber-50" },
>           ].map(a => (
>             <div key={a.t} className={`rounded-xl p-3 flex items-center gap-3 ${a.c}`}>
>               <div className="text-2xl">{a.i}</div>
>               <div className="flex-1 min-w-0">
>                 <p className="text-sm font-black text-foreground truncate">{a.t}</p>
>                 <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{a.sub}</p>
>               </div>
>               <span className={`text-xs font-black ${a.v.startsWith("-") ? "text-red-500" : "text-primary"}`}>{a.v}</span>
>             </div>
>           ))}
>         </div>
>         <div className="space-y-2">
>           <button type="button" onClick={() => p.go("history")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
>             <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><Recycle className="w-4 h-4 text-primary" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Recycling History</p><p className="text-[10px] text-muted-foreground font-semibold">All submitted items</p></div></div>
>             <ChevronRight className="w-4 h-4 text-muted-foreground" />
>           </button>
>           <button type="button" onClick={() => p.go("redeem-history")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
>             <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></div><div className="text-left"><p className="text-sm font-black text-foreground">My Redemptions</p><p className="text-[10px] text-muted-foreground font-semibold">Redeemed rewards & delivery</p></div></div>
>             <ChevronRight className="w-4 h-4 text-muted-foreground" />
>           </button>
>           <button type="button" onClick={() => p.go("tasks")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
>             <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><CheckSquare2 className="w-4 h-4 text-blue-600" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Achievements</p><p className="text-[10px] text-muted-foreground font-semibold">Milestones & badges</p></div></div>
>             <ChevronRight className="w-4 h-4 text-muted-foreground" />
>           </button>
>           <button type="button" onClick={() => p.go("settings")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
>             <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><Settings className="w-4 h-4 text-muted-foreground" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Settings</p><p className="text-[10px] text-muted-foreground font-semibold">Account, security</p></div></div>
>             <ChevronRight className="w-4 h-4 text-muted-foreground" />
>           </button>
>         </div>
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenSettings(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <h2 className="text-xl font-black text-foreground flex-1">Settings</h2>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-16">
>         {p.profileBanner && (
>           <div className={`rounded-xl px-4 py-3 text-sm font-bold ${p.profileBanner.type === "ok" ? BADGE_OK_BG : BADGE_DANGER_BG}`}>{p.profileBanner.text}</div>
>         )}
>         <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
>           <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Edit profile</p>
>           <div className="grid grid-cols-2 gap-3">
>             <Field label="First Name" placeholder="Maria" icon={<User className="w-4 h-4" />} value={p.setFName} onChange={p.setSetFName} />
>             <Field label="Last Name" placeholder="Santos" icon={<User className="w-4 h-4" />} value={p.setLName} onChange={p.setSetLName} />
>           </div>
>           <Field label="Email" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.setFormEmail} onChange={p.setSetFormEmail} />
>           <Field label="Phone Number" placeholder="+63 912 345 6789" icon={<Phone className="w-4 h-4" />} value={p.setPhone} onChange={p.setSetPhone} />
>           <div className="grid grid-cols-3 gap-3">
>             <Field label="Province" placeholder="Metro Manila" icon={<MapPin className="w-4 h-4" />} value={p.setProvince} onChange={p.setSetProvince} />
>             <Field label="City" placeholder="Quezon City" icon={<MapPin className="w-4 h-4" />} value={p.setCity} onChange={p.setSetCity} />
>             <Field label="Barangay" placeholder="Commonwealth" icon={<MapPin className="w-4 h-4" />} value={p.setBrgy} onChange={p.setSetBrgy} />
>           </div>
>           <button type="button" onClick={p.handleSaveProfile} disabled={p.profileSaving} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60`}>
>             {p.profileSaving ? "Saving..." : "💾 Save Changes"}
>           </button>
>         </div>
>         {isServerIpPanelEnabled() && (
>         <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
>           <div className="flex items-center justify-between">
>             <div>
>               <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Backend Server IP</p>
>               <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">XAMPP LAN IP where Waste2Goods backend runs. Mobile app expects raw IP (no http:// or port).</p>
>             </div>
>             <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Globe className="w-4 h-4 text-blue-600" /></div>
>           </div>
>           <ServerIpPanel apiHost={p.apiHost} setApiHost={p.setApiHost} onSaved={() => p.setProfileBanner({ type: "ok", text: "✅ Server IP saved. API requests will use this host." })} />
>         </div>
>         )}
>       </div>
>     </div>
>   );
> }
> 
> function ScreenHistory(p: MobileAppRouterProps) {
>   const items = [
>     { t: "Mixed recyclables", v: "+23 pts", sub: "2.3 kg · K-01 · 2h ago", i: "♻️", c: "bg-green-50", kg: "2.3kg", p: "+23" },
>     { t: "PET Bottles (15x)", v: "+8 pts", sub: "0.8 kg · K-01 · Yesterday", i: "🧴", c: "bg-blue-50", kg: "0.8kg", p: "+8" },
>     { t: "Cardboard boxes", v: "+12 pts", sub: "1.2 kg · K-02 · 2 days ago", i: "📦", c: "bg-amber-50", kg: "1.2kg", p: "+12" },
>     { t: "Aluminum cans (20x)", v: "+3 pts", sub: "0.3 kg · K-01 · 4 days ago", i: "🥫", c: "bg-emerald-50", kg: "0.3kg", p: "+3" },
>     { t: "Mixed paper", v: "+5 pts", sub: "0.5 kg · K-03 · 1 week ago", i: "📄", c: "bg-purple-50", kg: "0.5kg", p: "+5" },
>   ];
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <h2 className="text-xl font-black text-foreground flex-1">Recycling History</h2>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-20">
>         <div className="grid grid-cols-3 gap-2 text-center">
>           {[
>             { l: "Total", v: `${(Number(p.currentUser.totalKg || 0) + 5.1).toFixed(1)} kg`, c: "from-primary to-emerald-600" },
>             { l: "Submissions", v: `${items.length}`, c: "from-blue-500 to-cyan-600" },
>             { l: "Points earned", v: `+51`, c: "from-amber-500 to-orange-600" },
>           ].map(s => (
>             <div key={s.l} className={`rounded-2xl p-3 bg-gradient-to-br ${s.c} text-white`}>
>               <p className="text-xs font-bold opacity-80">{s.l}</p>
>               <p className="text-xl font-black mt-0.5">{s.v}</p>
>             </div>
>           ))}
>         </div>
>         <div className="rounded-2xl border border-border bg-white overflow-hidden">
>           {items.map((a, i) => (
>             <div key={a.t} className={`flex items-center gap-3 px-4 py-3 ${i !== items.length - 1 ? "border-b border-border" : ""}`}>
>               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${a.c}`}>{a.i}</div>
>               <div className="flex-1 min-w-0">
>                 <p className="text-sm font-black text-foreground">{a.t}</p>
>                 <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{a.sub}</p>
>               </div>
>               <div className="text-right">
>                 <p className="text-xs font-black text-primary">{a.v}</p>
>                 <p className="text-[10px] text-muted-foreground font-semibold">{a.kg}</p>
>               </div>
>             </div>
>           ))}
>         </div>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenRedeemHistory(p: MobileAppRouterProps) {
>   const [items, setItems] = useState([
>     {
>       id: "RD-101",
>       n: "P50 GCash Load",
>       pts: "500 pts",
>       i: "📱",
>       status: "ready",
>       t: "Arrives in 24 hours",
>       code: "GC-2G-9841",
>       pickupLocation: "GCash Digital Distribution",
>       pickupHours: "Processed within 24 Hours",
>       instructions: "Credits will be transferred to your registered mobile number automatically upon verification.",
>       date: "Aug 26, 2026"
>     },
>     {
>       id: "RD-102",
>       n: "5kg Rice Voucher",
>       pts: "1,200 pts",
>       i: "🍚",
>       status: "claimed",
>       t: "Redeemed at K-01",
>       code: "RICE-88-1204",
>       pickupLocation: "Cabantian Barangay Hall (Resource Desk)",
>       pickupHours: "Mon-Fri: 8:00 AM – 5:00 PM",
>       instructions: "Present this voucher code to the desk officer to collect your 5kg Premium Rice pack.",
>       date: "Aug 20, 2026"
>     },
>     {
>       id: "RD-103",
>       n: "School Supplies Kit",
>       pts: "800 pts",
>       i: "🎒",
>       status: "ready",
>       t: "Pick up at Barangay Hall",
>       code: "EDU-44-5920",
>       pickupLocation: "Cabantian Barangay Hall (Ecology Desk)",
>       pickupHours: "Mon-Fri: 8:00 AM – 5:00 PM",
>       instructions: "Present your Claim Code or Resident ID (Maria Santos) at the barangay hall to claim your kit.",
>       date: "Aug 25, 2026"
>     },
>   ]);
> 
>   const [selectedClaim, setSelectedClaim] = useState<any>(null);
>   const [copied, setCopied] = useState(false);
> 
>   const copyCode = (code: string) => {
>     navigator.clipboard.writeText(code);
>     setCopied(true);
>     setTimeout(() => setCopied(false), 2000);
>   };
> 
>   const markAsClaimed = (id: string) => {
>     setItems(prev => prev.map(item => item.id === id ? { ...item, status: "claimed" } : item));
>     if (selectedClaim?.id === id) {
>       setSelectedClaim((prev: any) => prev ? { ...prev, status: "claimed" } : null);
>     }
>   };
> 
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto relative">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <h2 className="text-xl font-black text-foreground flex-1">My Redemptions</h2>
>       </div>
>       <div className="p-5 space-y-3 overflow-y-auto flex-1 pb-20">
>         <p className="text-xs text-muted-foreground font-semibold">Tap on any item to view claim details, pickup instructions, and voucher codes.</p>
>         {items.map(h => {
>           const isReady = h.status === "ready";
>           return (
>             <button
>               key={h.id}
>               type="button"
>               onClick={() => setSelectedClaim(h)}
>               className={`w-full text-left rounded-2xl border transition-all p-4 flex items-start gap-4 ${
>                 isReady
>                   ? "bg-white border-green-300 hover:border-primary hover:shadow-md cursor-pointer ring-1 ring-green-100"
>                   : "bg-white/80 border-border hover:border-muted-foreground/40 cursor-pointer"
>               }`}
>             >
>               <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-3xl flex-shrink-0">{h.i}</div>
>               <div className="flex-1 min-w-0">
>                 <div className="flex items-center gap-2">
>                   <p className="text-sm font-black text-foreground">{h.n}</p>
>                   {isReady && <span className="text-[10px] bg-green-50 text-green-700 font-black px-1.5 py-0.5 rounded border border-green-200">Tap to view</span>}
>                 </div>
>                 <p className="text-xs text-muted-foreground mt-0.5">{h.t} · <span className="font-mono font-bold text-foreground">{h.code}</span></p>
>                 <p className="text-xs font-black text-primary mt-0.5">{h.pts} spent</p>
>               </div>
>               <div className="flex flex-col items-end gap-1">
>                 <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isReady ? "bg-green-100 text-green-700 font-black" : "bg-muted text-muted-foreground"}`}>
>                   {isReady ? "Ready to pick up" : "Claimed"}
>                 </span>
>                 <ChevronRight className="w-4 h-4 text-muted-foreground" />
>               </div>
>             </button>
>           );
>         })}
>       </div>
> 
>       {/* Interactive Claim Details Modal */}
>       {selectedClaim && (
>         <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
>           <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
>             {/* Header */}
>             <div className="flex items-center justify-between pb-3 border-b border-border">
>               <div className="flex items-center gap-3">
>                 <span className="text-4xl">{selectedClaim.i}</span>
>                 <div>
>                   <h3 className="font-black text-lg text-foreground leading-tight">{selectedClaim.n}</h3>
>                   <p className="text-xs text-muted-foreground">Redeemed on {selectedClaim.date} • {selectedClaim.pts}</p>
>                 </div>
>               </div>
>               <button
>                 type="button"
>                 onClick={() => setSelectedClaim(null)}
>                 className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
>               >
>                 <X className="w-4 h-4" />
>               </button>
>             </div>
> 
>             {/* Status Progress Stepper */}
>             <div className="p-4 rounded-2xl bg-muted/40 border border-border">
>               <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wide mb-3">Redemption Progress</p>
>               <div className="flex items-center justify-between relative px-2">
>                 <div className="flex flex-col items-center gap-1 z-10">
>                   <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold"><Check className="w-4 h-4" /></div>
>                   <span className="text-[10px] font-bold text-foreground">Redeemed</span>
>                 </div>
>                 <div className={`h-1 flex-1 ${selectedClaim.status === "claimed" || selectedClaim.status === "ready" ? "bg-green-500" : "bg-border"} -mx-2 mb-4`} />
>                 <div className="flex flex-col items-center gap-1 z-10">
>                   <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedClaim.status === "claimed" ? "bg-green-500 text-white" : "bg-primary text-white ring-4 ring-primary/20"}`}>
>                     {selectedClaim.status === "claimed" ? <Check className="w-4 h-4" /> : <Package className="w-4 h-4" />}
>                   </div>
>                   <span className="text-[10px] font-bold text-foreground">Ready to Pick</span>
>                 </div>
>                 <div className={`h-1 flex-1 ${selectedClaim.status === "claimed" ? "bg-green-500" : "bg-border"} -mx-2 mb-4`} />
>                 <div className="flex flex-col items-center gap-1 z-10">
>                   <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedClaim.status === "claimed" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
>                     {selectedClaim.status === "claimed" ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
>                   </div>
>                   <span className="text-[10px] font-bold text-muted-foreground">Claimed</span>
>                 </div>
>               </div>
>             </div>
> 
>             {/* Claim Code Box */}
>             <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 flex items-center justify-between">
>               <div>
>                 <p className="text-[11px] font-black text-green-800 uppercase tracking-wide">Claim / Voucher Code</p>
>                 <p className="text-xl font-mono font-black text-green-900 tracking-wider mt-0.5">{selectedClaim.code}</p>
>               </div>
>               <button
>                 type="button"
>                 onClick={() => copyCode(selectedClaim.code)}
>                 className="px-3.5 py-2 rounded-xl bg-white border border-green-300 text-green-800 text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-green-50 transition-all"
>               >
>                 {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-green-700" />}
>                 {copied ? "Copied!" : "Copy"}
>               </button>
>             </div>
> 
>             {/* Pickup Location & Hours */}
>             <div className="p-4 rounded-2xl border border-border bg-white space-y-2">
>               <div className="flex items-start gap-2.5">
>                 <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
>                 <div>
>                   <p className="text-xs font-black text-foreground">Pickup Location</p>
>                   <p className="text-xs text-muted-foreground mt-0.5">{selectedClaim.pickupLocation}</p>
>                 </div>
>               </div>
>               <div className="flex items-start gap-2.5 pt-2 border-t border-border">
>                 <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
>                 <div>
>                   <p className="text-xs font-black text-foreground">Operating Schedule</p>
>                   <p className="text-xs text-muted-foreground mt-0.5">{selectedClaim.pickupHours}</p>
>                 </div>
>               </div>
>             </div>
> 
>             {/* Step-by-Step Claim Instructions */}
>             <div className="p-4 rounded-2xl bg-muted/20 border border-border">
>               <p className="text-xs font-black text-foreground mb-2">How to Claim Your Reward</p>
>               <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
>                 <li>Visit the pickup location during official hours.</li>
>                 <li>Present your <strong>Claim Code</strong> or Resident ID to the desk officer.</li>
>                 <li>Verify your item and receive your reward package.</li>
>               </ul>
>             </div>
> 
>             {/* Action Buttons */}
>             <div className="flex gap-2 pt-2">
>               {selectedClaim.status === "ready" ? (
>                 <button
>                   type="button"
>                   onClick={() => markAsClaimed(selectedClaim.id)}
>                   className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
>                 >
>                   <CheckCircle2 className="w-4 h-4" />
>                   Mark as Claimed (Simulate)
>                 </button>
>               ) : (
>                 <div className="flex-1 py-3 rounded-xl bg-green-100 text-green-800 text-sm font-bold text-center flex items-center justify-center gap-2">
>                   <Check className="w-4 h-4" /> Reward Successfully Claimed
>                 </div>
>               )}
>               <button
>                 type="button"
>                 onClick={() => setSelectedClaim(null)}
>                 className="px-5 py-3 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
>               >
>                 Close
>               </button>
>             </div>
>           </div>
>         </div>
>       )}
>     </div>
>   );
> }
> 
> type RedeemConfirmProps = MobileAppRouterProps & Readonly<{ onRedeem: () => Promise<void>; onClose: () => void }>;
> function ScreenRedeemConfirm(p: RedeemConfirmProps) {
>   const r = p.selectedReward!;
>   const cost = r.cost ?? r.points ?? 0;
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto bg-white">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <button type="button" onClick={p.onClose}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <h2 className="text-xl font-black text-foreground flex-1">Confirm Redemption</h2>
>       </div>
>       <div className="flex-1 flex flex-col items-center p-6 space-y-5 overflow-y-auto pb-20">
>         <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-primary/20 flex items-center justify-center text-6xl">{r.icon}</div>
>         <div className="text-center">
>           <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Redeeming</p>
>           <h2 className="text-2xl font-black text-foreground mt-1">{r.name}</h2>
>           <p className="text-xs text-muted-foreground mt-2">{r.description ?? "Redeemable with your recycling points."}</p>
>         </div>
>         <div className="w-full max-w-md rounded-2xl border border-border bg-white p-4 flex items-center gap-3">
>           <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Wallet className="w-5 h-5 text-primary" /></div>
>           <div className="flex-1">
>             <p className="text-xs text-muted-foreground font-semibold">Your balance</p>
>             <p className="text-sm font-black text-foreground">{Number(p.currentUser.points || 0).toLocaleString()} pts</p>
>           </div>
>           <div className="text-right">
>             <p className="text-xs text-muted-foreground font-semibold">After</p>
>             <p className="text-sm font-black text-primary">{(Number(p.currentUser.points || 0) - Number(cost)).toLocaleString()} pts</p>
>           </div>
>         </div>
>         <div className="w-full max-w-md grid grid-cols-2 gap-3 pt-2">
>           <button type="button" onClick={p.onClose} className={`py-4 ${BTN_SECONDARY_CLS} text-base`}>Cancel</button>
>           <button type="button" onClick={p.onRedeem} className={`py-4 ${BTN_PRIMARY_CLS} text-base`}>Confirm · {cost} pts</button>
>         </div>
>       </div>
>     </div>
>   );
> }
> 
> export default function App() {
>   const [screen, setScreen] = useState<MobileScreen>("splash");
>   const [leaderTab, setLeaderTab] = useState<"weekly" | "monthly">("weekly");
>   const [regStep, setRegStep] = useState(0);
>   const [selectedReward, setSelectedReward] = useState<typeof rewards[0] | null>(null);
>   const [rewardFilter, setRewardFilter] = useState("All");
>   const [mfaCode, setMfaCode] = useState(["", "", "", "", "", ""]);
>   const [weighing, setWeighing] = useState(false);
>   const [email, setEmail] = useState("");
>   const [password, setPassword] = useState("");
>   const [loginError, setLoginError] = useState("");
>   const [loginLoading, setLoginLoading] = useState(false);
>   // Registration form state
>   const [regFullName, setRegFullName] = useState("");
>   const [regEmail, setRegEmail] = useState("");
>   const [regPassword, setRegPassword] = useState("");
>   const [regConfirmPassword, setRegConfirmPassword] = useState("");
>   const [regPhone, setRegPhone] = useState("");
>   const [regProvince, setRegProvince] = useState("");
>   const [regCity, setRegCity] = useState("");
>   const [regBarangay, setRegBarangay] = useState("");
>   const [regStreetAddress, setRegStreetAddress] = useState("");
>   const [regLoading, setRegLoading] = useState(false);
>   const [regError, setRegError] = useState("");
>   // ── Profile state (refreshed from DB when profile screen opens) ──
>   // Initialize immediately from localStorage so the greeting never shows
>   // "Guest User" flash on a real logged-in session (persistent auth restore).
>   const [profileUser, setProfileUser] = useState<any>(() => {
>     try {
>       const raw = localStorage.getItem("w2g_auth_state");
>       if (!raw) return null;
>       const parsed = JSON.parse(raw);
>       return parsed?.user && (parsed.user.id || parsed.user.userId) ? { ...parsed.user } : null;
>     } catch {
>       return null;
>     }
>   });
>   const [profileRank, setProfileRank] = useState<string>("#-");
>   const [profileSaving, setProfileSaving] = useState(false);
>   const [profileBanner, setProfileBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
>   // Live editable settings form (defaultValue on inputs is broken without controlled state)
>   const [setFName, setSetFName] = useState("");
>   const [setLName, setSetLName] = useState("");
>   const [setFormEmail, setSetFormEmail] = useState("");
>   const [setPhone, setSetPhone] = useState("");
>   const [setBrgy, setSetBrgy] = useState("");
>   const [setCity, setSetCity] = useState("");
>   const [setProvince, setSetProvince] = useState("");
>   // ── Live leaderboard from DB (fallback to DEMO_LEADERBOARD_FALLBACK if API unavailable) ──
>   const [liveLeaderboard, setLiveLeaderboard] = useState<any[] | null>(null);
>   // ── Notifications state (for mobile 🔔 bell) ──
>   const [notifItems, setNotifItems] = useState<any[]>([]);
>   const [notifUnread, setNotifUnread] = useState(0);
>   const [kioskSession, setKioskSession] = useState<{ connected: boolean; kioskId?: string; connectedAt?: number }>({ connected: false });
>   const [kioskChecking, setKioskChecking] = useState(false);
>   const [apiHost, setApiHost] = useState(() => getApiHost());
>   const [showLoginServer, setShowLoginServer] = useState(() => {
>     try {
>       const hasSetIp = localStorage.getItem("w2g_api_host");
>       return !hasSetIp;
>     } catch {
>       return true;
>     }
>   });
>   const [loginServerBanner, setLoginServerBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
>   const weight = useAnimatedWeight(2.3, weighing);
>   const mfaRefs = useRef<(HTMLInputElement | null)[]>([]);
> 
>   const availableCities = regProvince ? Object.keys(PH_LOCATIONS[regProvince] || {}).sort(alphabeticalCompare) : [];
>   const availableBarangays =
>     regProvince && regCity ? (PH_LOCATIONS[regProvince]?.[regCity] || []).sort(alphabeticalCompare) : [];
> 
>   const go = (s: MobileScreen) => setScreen(s);
> 
>   // ── Automatic URL Pathname Sanitizer ──
>   useEffect(() => {
>     try {
>       if (typeof window !== "undefined" && window.location.pathname && window.location.pathname !== "/") {
>         if (window.location.pathname.includes("192.168.") || window.location.pathname.includes("localhost") || window.location.pathname.includes("/api/auth")) {
>           window.history.replaceState({}, document.title, "/");
>         }
>       }
>     } catch { /* ignore */ }
>   }, []);
> 
>   // ── OAuth Callback Query Parameter Handler (Native + Appwrite SDK) ──
>   useEffect(() => {
>     let cancelled = false;
>     (async () => {
>       try {
>         const params = new URLSearchParams(window.location.search);
> 
>         // 0. OAuth failure — the backend redirects here with `oauth_error` instead of
>         //    a dead-end JSON page, so show the real reason on the login screen.
>         const oauthError = params.get("oauth_error");
>         if (oauthError) {
>           window.history.replaceState({}, document.title, window.location.pathname);
>           setLoginError(`Sign-in failed: ${oauthError}`);
>           if (!cancelled) setScreen("login");
>           return;
>         }
> 
>         // 1. Native backend OAuth redirect — tokens come as URL params
>         const token = params.get("token") || params.get("accessToken");
>         if (token) {
>           const userId = params.get("userId") || "U-001";
>           const provider = params.get("provider") || "oauth";
>           const name = params.get("name") || (provider === "github" ? "GitHub User" : "Resident");
>           const email = params.get("email") || "";
>           const role = params.get("role") || "resident";
>           const refreshToken = params.get("refreshToken") || "";
>           const userObj = {
>             id: userId,
>             userId,
>             name,
>             email,
>             role,
>             total_points: 0,
>             pointsBalance: 0,
>             barangayName: "Cabantian",
>           };
>           const authState: any = {
>             token,
>             accessToken: token,
>             refreshToken,
>             isAuthenticated: true,
>             user: userObj,
>           };
>           localStorage.setItem("w2g_auth_state", JSON.stringify(authState));
>           setProfileUser({ ...userObj });
>           window.history.replaceState({}, document.title, window.location.pathname);
>           if (!cancelled) setScreen("home");
>           return;
>         }
> 
>         // 2. Appwrite SDK OAuth redirect — Appwrite saved a session but no URL tokens.
>         //    We detect an active Appwrite account session → create JWT → sync with backend → get platform tokens.
>         Waste2GoodsAPI.appwrite.configure();
>         const me = await Waste2GoodsAPI.appwrite.whoAmI();
>         if (me && !cancelled) {
>           const provider =
>             (typeof (me as any).providerType === "string" && (me as any).providerType) ||
>             (typeof (me as any).provider === "string" && (me as any).provider) ||
>             "appwrite";
>           const synced = await Waste2GoodsAPI.appwrite.syncWithBackend({ provider });
>           if (synced?.token && synced?.user && !cancelled) {
>             setProfileUser({ ...(synced.user as any) });
>             window.history.replaceState({}, document.title, window.location.pathname);
>             setScreen("home");
>           }
>         }
>       } catch (e) {
>         if (!cancelled) console.warn("OAuth callback handler:", e);
>       }
>     })();
>     return () => { cancelled = true; };
>   }, []);
> 
>   useEffect(() => {
>     if (screen === "splash") {
>       // PERSISTENT AUTH: Do NOT logout on every app launch.
>       // Instead check localStorage for a valid saved session — if found,
>       // skip onboarding and jump straight to Home (user stays signed in
>       // until they explicitly tap "Sign Out" on the Profile screen).
>       const t = setTimeout(() => {
>         const existing = Waste2GoodsAPI.getAuthState();
>         if (existing?.isAuthenticated && existing?.token && existing?.user) {
>           go("home");
>         } else {
>           go("onboard1");
>         }
>       }, 1200);
>       return () => clearTimeout(t);
>     }
>   }, [screen]);
> 
>   // AUTH GUARD: If screen is a protected route but no valid auth token, force back to login.
>   // (Prevents stale state or manual state tampering from bypassing sign-in.)
>   useEffect(() => {
>     if (!UNPROTECTED_SCREENS.has(screen)) {
>       const auth = Waste2GoodsAPI.getAuthState();
>       if (!auth?.isAuthenticated || !auth?.token) {
>         console.log("🔐 Mobile auth guard: no valid token — returning to login");
>         Waste2GoodsAPI.logout();
>         setScreen("login");
>       }
>     }
>   }, [screen]);
> 
>   // Helper to get current user's display data — reactive (reads from profileUser state when set)
>   const currentUser = useMemo(() => buildCurrentUser(profileUser), [profileUser]);
> 
>   // Merged leaderboard: prefer live DB rows (with correct user names from MySQL),
>   // otherwise fall back to the demo placeholder list. Always returns a non-empty array
>   // so the Community Leaderboard panel never appears empty.
>   const mergedLeaderboard = useMemo(
>     () => buildMergedLeaderboard(liveLeaderboard || null, currentUser),
>     [liveLeaderboard, currentUser.id, currentUser.userId, currentUser.barangay],
>   );
> 
>   // When user opens Profile, Settings, or History — re-pull their latest DB row
>   // (points, submissions, name) and their current leaderboard rank.
>   // Also seed the editable settings form fields so the "Save Changes" button works.
>   useEffect(() => {
>     if (!["profile", "settings", "history"].includes(screen)) return;
>     let cancelled = false;
>     (async () => {
>       setProfileBanner(null);
>       // Refresh user from GET /users/:id and sync to localStorage
>       const refreshed = Waste2GoodsAPI.refreshCurrentUser ? await Waste2GoodsAPI.refreshCurrentUser() : null;
>       if (cancelled) return;
>       if (refreshed) setProfileUser({ ...refreshed });
>       else {
>         const storedUser = Waste2GoodsAPI.getAuthState()?.user;
>         if (storedUser) setProfileUser({ ...storedUser });
>       }
> 
>       const rankPromise = Waste2GoodsAPI.getCurrentRank ? Waste2GoodsAPI.getCurrentRank() : Promise.resolve("#-");
>       const rank = await rankPromise;
>       if (cancelled) return;
>       setProfileRank(rank || "#-");
>     })();
>     return () => { cancelled = true; };
>   }, [screen]);
> 
>   // Fetch MY notifications (mobile 🔔 bell) when user enters Home or Notifications screen,
>   // or just after login/authenticated screens to keep the red-dot badge accurate.
>   // Also re-fetch whenever notifications screen is about to be entered for freshness.
>   useEffect(() => {
>     const authScreens: MobileScreen[] = ["home", "notifications", "profile", "tasks", "rewards", "submit", "history", "settings", "redeem-history", "redeem-confirm"];
>     if (!authScreens.includes(screen)) return;
>     let cancelled = false;
>     (async () => {
>       if (!Waste2GoodsAPI.getMyNotifications) return;
>       const res = await Waste2GoodsAPI.getMyNotifications();
>       if (cancelled || !res) return;
>       setNotifItems(res.items || []);
>       setNotifUnread(Number(res.unread || 0));
>     })();
>     return () => { cancelled = true; };
>   }, [screen]);
> 
>   // Fetch LIVE leaderboard from real DB on Home + Rewards/Leaderboard views.
>   // Falls back to DEMO_LEADERBOARD_FALLBACK silently if backend unreachable so UI stays clean.
>   useEffect(() => {
>     const watchScreens: MobileScreen[] = ["home", "rewards", "leaderboard"];
>     if (!watchScreens.includes(screen)) return;
>     let cancelled = false;
>     (async () => {
>       try {
>         if (!Waste2GoodsAPI.fetchLeaderboard) return;
>         const rows = await Waste2GoodsAPI.fetchLeaderboard();
>         if (cancelled) return;
>         setLiveLeaderboard(Array.isArray(rows) && rows.length > 0 ? rows : null);
>       } catch (err) {
>         console.warn("Leaderboard fetch failed:", err);
>         if (!cancelled) setLiveLeaderboard(null);
>       }
>     })();
>     return () => { cancelled = true; };
>   }, [screen]);
> 
>   // Poll backend: is this user currently linked to a kiosk?
>   // Also tick every second so the "elapsed" label in the badge refreshes in real-time
>   const [kioskTick, setKioskTick] = useState(0);
>   useEffect(() => {
>     const watchScreens: MobileScreen[] = ["home", "submit", "submit-scan", "submit-confirm", "submit-done", "profile", "settings", "tasks", "rewards"];
>     if (!watchScreens.includes(screen)) return;
>     const uid = currentUser.id || currentUser.userId;
>     if (!uid) return;
>     let cancelled = false;
>     const poll = async () => {
>       if (!Waste2GoodsAPI.getKioskSessionStatus) return;
>       setKioskChecking(true);
>       const res = await Waste2GoodsAPI.getKioskSessionStatus(uid);
>       if (cancelled) return;
>       setKioskChecking(false);
>       if (!res) {
>         setKioskSession({ connected: false });
>         return;
>       }
>       setKioskSession(prev => ({
>         connected: !!res.connected,
>         kioskId: res.kioskId,
>         connectedAt: res.connected
>           ? (res.connectedAt ?? prev.connectedAt ?? Date.now())
>           : undefined,
>       }));
>     };
>     poll();
>     const iv = setInterval(poll, 3000);
>     const tickIv = setInterval(() => setKioskTick(t => t + 1), 1000);
>     return () => { cancelled = true; clearInterval(iv); clearInterval(tickIv); };
>   }, [screen, currentUser.id, currentUser.userId]);
> 
>   // Disconnect current kiosk session (callable from the badge)
>   const handleDisconnectKiosk = async () => {
>     const uid = currentUser.id || currentUser.userId;
>     if (!uid) return;
>     try {
>       await Waste2GoodsAPI.disconnectKioskSession?.(uid);
>     } catch { /* ignore */ }
>     setKioskSession({ connected: false });
>     try {
>       localStorage.removeItem("w2g_kiosk_qr_bridge");
>       window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge" }));
>     } catch { /* ignore */ }
>   };
> 
>   // Live "time since kiosk link" label for the kiosk badge. Recomputed on every second-tick
>   // (kioskTick) so the elapsed text stays current without restarting the polling interval.
>   const kioskElapsedLabel = useMemo(
>     () => elapsedFromTs(kioskSession.connectedAt),
>     [kioskSession.connectedAt, kioskTick],
>   );
>   // Seed the settings form inputs from currentUser whenever the screen opens
>   useEffect(() => {
>     if (screen !== "settings") return;
>     // Split name → first/last for editable fields (else leave blank)
>     const parts = (currentUser.name || "").trim().split(/\s+/);
>     const first = currentUser.firstName || parts[0] || "";
>     const last = currentUser.lastName || parts.slice(1).join(" ") || "";
>     setSetFName(first);
>     setSetLName(last);
>     setSetFormEmail(currentUser.email || "");
>     setSetPhone(currentUser.phone || "");
>     setSetBrgy(currentUser.barangay || "");
>     setSetCity(currentUser.city || "");
>     setSetProvince(currentUser.province || "");
>     setProfileBanner(null);
>     setApiHost(getApiHost());
>   }, [screen, currentUser.id]);
> 
>   // Build the "Since Month Year" string from the user's actual createdAt row
>   const profileSinceLabel = (() => {
>     if (currentUser.joined) return `Since ${currentUser.joined}`;
>     if (currentUser.createdAt) {
>       try {
>         return `Since ${new Date(currentUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
>       } catch { /* ignore */ }
>     }
>     return "Since Today";
>   })();
> 
>   // Build profile update patches from current form state — extracted to keep
>   // handleSaveProfile below the 15-point cognitive complexity ceiling (S3776).
>   const buildProfilePatches = (): Record<string, any> => {
>     const patches: Record<string, any> = {};
>     if (setFName) patches.firstName = setFName;
>     if (setLName) patches.lastName = setLName;
>     if (setFormEmail) patches.email = setFormEmail;
>     if (setPhone) patches.phone = setPhone;
>     if (setProvince) patches.province = setProvince;
>     if (setCity) patches.city = setCity;
>     if (setBrgy) patches.barangayName = setBrgy;
>     return patches;
>   };
> 
>   // Perform the profile save HTTP call — supports both Waste2GoodsAPI.saveProfile
>   // helper and a raw fetch fallback — extracted to keep handleSaveProfile simple.
>   const saveProfileViaApiCall = async (patches: Record<string, any>): Promise<boolean> => {
>     if (Waste2GoodsAPI.saveProfile) {
>       return Waste2GoodsAPI.saveProfile(patches);
>     }
>     const userId = currentUser.id || currentUser.userId;
>     const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
>       method: "PUT",
>       headers: { "Content-Type": "application/json", Authorization: `Bearer ${Waste2GoodsAPI.getAuthState()?.token || ""}` },
>       body: JSON.stringify(patches),
>     });
>     return res.ok;
>   };
> 
>   // Handler for the Settings "Save Changes" button — PUTs to /users/:id via core helper
>   const handleSaveProfile = async () => {
>     setProfileSaving(true);
>     setProfileBanner(null);
>     try {
>       const patches = buildProfilePatches();
>       const ok = await saveProfileViaApiCall(patches);
>       if (ok) {
>         const fresh = Waste2GoodsAPI.refreshCurrentUser ? await Waste2GoodsAPI.refreshCurrentUser() : null;
>         if (fresh) setProfileUser({ ...fresh });
>         setProfileBanner({ type: "ok", text: "✅ Profile saved successfully!" });
>       } else {
>         setProfileBanner({ type: "err", text: "⚠️ Failed to save. Check backend connection." });
>       }
>     } catch (e) {
>       setProfileBanner({ type: "err", text: e instanceof Error ? e.message : "⚠️ Save failed" });
>     } finally {
>       setProfileSaving(false);
>     }
>   };
> 
>   useEffect(() => {
>     if (screen === "submit-scan") {
>       const t = setTimeout(() => go("submit-confirm"), 2200);
>       return () => clearTimeout(t);
>     }
>   }, [screen]);
> 
>   useEffect(() => {
>     if (screen === "submit-confirm") {
>       setWeighing(false);
>       setTimeout(() => setWeighing(true), 300);
>     }
>   }, [screen]);
> 
>   // QR Scanner for mobile
>   useEffect(() => {
>     if (screen === "submit-scan") {
>       // Initialize the scanner
>       const scanner = new Html5QrcodeScanner(
>         "qr-reader",
>         { fps: 10, qrbox: { width: 250, height: 250 } },
>         false
>       );
>       scanner.render(
>         (decodedText) => {
>           console.log("QR code scanned:", decodedText);
>           // Write QR BRIDGE so Kiosk (cross-tab) picks up this logged-in user
>           // This is how the mobile signals the kiosk: "I am [user], connect me"
>           try {
>             const auth = Waste2GoodsAPI.getAuthState();
>             const u = auth?.user || {};
>             const bridgePayload = {
>               user: {
>                 id: (u as any).id || (u as any).userId || currentUser.id || "U-001",
>                 userId: (u as any).id || (u as any).userId || currentUser.id || "U-001",
>                 name: currentUser.name && currentUser.name !== "Guest User" ? currentUser.name : (u as any).name || `${(u as any).firstName || ""} ${(u as any).lastName || ""}`.trim() || "Registered User",
>                 firstName: (u as any).firstName,
>                 lastName: (u as any).lastName,
>                 email: currentUser.email || (u as any).email || "",
>                 points: currentUser.points ?? (u as any).pointsBalance ?? 0,
>                 pointsBalance: currentUser.points ?? (u as any).pointsBalance ?? 0,
>               },
>               kioskPayload: decodedText,
>               timestamp: Date.now(),
>             };
>             localStorage.setItem("w2g_kiosk_qr_bridge", JSON.stringify(bridgePayload));
>             // Also emit cross-tab storage event for same-origin kiosk tabs already listening
>             try { window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge", newValue: JSON.stringify(bridgePayload) })); } catch {}
>             Waste2GoodsAPI.connectKioskSession?.({
>               userId: bridgePayload.user.id || bridgePayload.user.userId,
>               userName: bridgePayload.user.name,
>               kioskId: decodedText.includes("K-") ? decodedText : "K-01",
>             });
>             console.log("✅ QR bridge written to localStorage (kiosk should pick up user within ~800ms):", bridgePayload.user.name);
>           } catch (bridgeErr) {
>             console.warn("QR bridge write failed:", bridgeErr);
>           }
>           scanner.clear().catch(() => {});
>           go("submit-confirm");
>         },
>         (errorMessage) => {
>           console.log("QR scan error:", errorMessage);
>         }
>       );
>       // Cleanup on unmount
>       return () => {
>         scanner.clear().catch(() => {});
>       };
>     }
>   }, [screen]);
> 
>   const rewardCategories = ["All", "Education", "Grocery", "Lifestyle", "Garden", "Wellness"];
>   const filteredRewards = rewardFilter === "All" ? rewards : rewards.filter(r => r.category === rewardFilter);
> 
> 
>   const onLogin = async () => {
>     setLoginError("");
>     setLoginLoading(true);
>     try {
>       const res = await Waste2GoodsAPI.login(email.trim(), password);
>       if (res?.user) setProfileUser({ ...res.user });
>       go("home");
>     } catch (err: any) {
>       setLoginError(err?.message || "Invalid email or password. Please try again.");
>     } finally {
>       setLoginLoading(false);
>     }
>   };
> 
>   const onRegisterStep1Next = () => {
>     if (validateRegisterStep1({ full: regFullName, email: regEmail, phone: regPhone, pwd: regPassword, confirm: regConfirmPassword }, setRegError)) {
>       setRegStep(1);
>     }
>   };
> 
>   const onRegisterStep2Next = () => {
>     if (validateRegisterAddress({ province: regProvince, city: regCity, barangay: regBarangay }, setRegError)) {
>       setRegStep(2);
>     }
>   };
> 
>   const onRegisterStep3MFA = async () => {
>     await doRegisterSubmit(
>       { full: regFullName, email: regEmail, pwd: regPassword, confirm: regConfirmPassword, phone: regPhone, province: regProvince, city: regCity, barangay: regBarangay, street: regStreetAddress },
>       setRegError,
>       setRegLoading,
>       setProfileUser,
>       setRegStep,
>       go,
>       "mfa"
>     );
>   };
> 
>   const onRegisterStep3Skip = async () => {
>     await doRegisterSubmit(
>       { full: regFullName, email: regEmail, pwd: regPassword, confirm: regConfirmPassword, phone: regPhone, province: regProvince, city: regCity, barangay: regBarangay, street: regStreetAddress },
>       setRegError,
>       setRegLoading,
>       setProfileUser,
>       setRegStep,
>       go,
>       "profile-setup"
>     );
>   };
> 
>   const onToggleLoginServer = () => setShowLoginServer(prev => !prev);
> 
>   const onRewardRedeem = async () => {
>     if (!selectedReward) return;
>     const cost = selectedReward.cost ?? selectedReward.points ?? 0;
>     const newBal = Math.max(0, Number(currentUser.points || 0) - Number(cost));
>     patchAuthBalance(newBal);
>     setProfileUser((prev: any) => ({ ...(prev || currentUser), points: newBal, pointsBalance: newBal, redeemed: Number(currentUser.redeemed || 0) + 1 }));
>     setSelectedReward(null);
>     go("redeem-history");
>   };
> 
>   const onRewardClose = () => setSelectedReward(null);
> 
>   const onSubmitConfirm = () => {
>     const earnedPts = Math.round(Number(weight) * 10);
>     const newBal = Number(currentUser.points || 0) + earnedPts;
>     const newTotalKg = Number(currentUser.totalKg || 0) + Number(weight);
>     patchAuthBalance(newBal);
>     setProfileUser((prev: any) => ({
>       ...(prev || currentUser),
>       points: newBal,
>       pointsBalance: newBal,
>       totalKg: newTotalKg,
>       submissions: Number(currentUser.submissions || 0) + 1,
>     }));
>     go("submit-done");
>   };
> 
>   return (
>     <div
>       className="flex flex-col w-full bg-background"
>       style={{
>         background: "#f0fdf4",
>         fontFamily: "'Nunito', sans-serif",
>         height: "100dvh",
>       }}
>     >
>       <MobileScreens
>         screen={screen}
>         leaderTab={leaderTab}
>         regStep={regStep}
>         selectedReward={selectedReward}
>         rewardFilter={rewardFilter}
>         mfaCode={mfaCode}
>         weighing={weighing}
>         email={email}
>         password={password}
>         loginError={loginError}
>         loginLoading={loginLoading}
>         regFullName={regFullName}
>         regEmail={regEmail}
>         regPassword={regPassword}
>         regConfirmPassword={regConfirmPassword}
>         regPhone={regPhone}
>         regProvince={regProvince}
>         regCity={regCity}
>         regBarangay={regBarangay}
>         regStreetAddress={regStreetAddress}
>         regLoading={regLoading}
>         regError={regError}
>         profileUser={profileUser}
>         profileRank={profileRank}
>         profileSaving={profileSaving}
>         profileBanner={profileBanner}
>         setFName={setFName}
>         setLName={setLName}
>         setFormEmail={setFormEmail}
>         setPhone={setPhone}
>         setProvince={setProvince}
>         setCity={setCity}
>         setBrgy={setBrgy}
>         showLoginServer={showLoginServer}
>         loginServerBanner={loginServerBanner}
>         apiHost={apiHost}
>         weight={weight}
>         kioskSession={kioskSession}
>         kioskChecking={kioskChecking}
>         kioskElapsedLabel={kioskElapsedLabel}
>         mergedLeaderboard={mergedLeaderboard}
>         currentUser={currentUser}
>         notifItems={notifItems}
>         notifUnread={notifUnread}
>         rewardCategories={rewardCategories}
>         filteredRewards={filteredRewards}
>         profileSinceLabel={profileSinceLabel}
>         availableCities={availableCities}
>         availableBarangays={availableBarangays}
>         mfaRefs={mfaRefs}
>         setLeaderTab={setLeaderTab}
>         setRegStep={setRegStep}
>         setSelectedReward={setSelectedReward}
>         setRewardFilter={setRewardFilter}
>         setMfaCode={setMfaCode}
>         setEmail={setEmail}
>         setPassword={setPassword}
>         setRegFullName={setRegFullName}
>         setRegEmail={setRegEmail}
>         setRegPassword={setRegPassword}
>         setRegConfirmPassword={setRegConfirmPassword}
>         setRegPhone={setRegPhone}
>         setRegProvince={setRegProvince}
>         setRegCity={setRegCity}
>         setRegBarangay={setRegBarangay}
>         setRegStreetAddress={setRegStreetAddress}
>         setRegError={setRegError}
>         setProfileBanner={setProfileBanner}
>         setSetFName={setSetFName}
>         setSetLName={setSetLName}
>         setSetFormEmail={setSetFormEmail}
>         setSetPhone={setSetPhone}
>         setSetProvince={setSetProvince}
>         setSetCity={setSetCity}
>         setSetBrgy={setSetBrgy}
>         setLoginServerBanner={setLoginServerBanner}
>         setApiHost={setApiHost}
>         handleSaveProfile={handleSaveProfile}
>         handleDisconnectKiosk={handleDisconnectKiosk}
>         onLogin={onLogin}
>         onRegisterStep1Next={onRegisterStep1Next}
>         onRegisterStep2Next={onRegisterStep2Next}
>         onRegisterStep3MFA={onRegisterStep3MFA}
>         onRegisterStep3Skip={onRegisterStep3Skip}
>         onToggleLoginServer={onToggleLoginServer}
>         onRewardRedeem={onRewardRedeem}
>         onRewardClose={onRewardClose}
>         onSubmitConfirm={onSubmitConfirm}
>         go={go}
>       />
>     </div>
>   );
> }

> **Attachment: attachment · txt · 20.4 KB**
>
> import {
>   USERS,
>   KIOSKS,
>   REWARDS,
>   TRANSACTIONS,
>   WEEKLY_DATA,
>   MONTHLY_DATA,
>   LEADERBOARD,
>   TASKS,
>   KIOSK_PIN,
>   DEMO_KIOSK_USER,
> } from "./constants.js";
> 
> // API Configuration.
> // Production (waste2goods.site, Cloudflare + Caddy): ALWAYS same-origin "/api".
> // Local dev (localhost / LAN IP): keep the manual host override.
> const API_HOST_STORAGE_KEY = "w2g_api_host";
> const DEFAULT_API_HOST = "localhost";
> 
> function isDeployedSite() {
>   try {
>     const hn = (typeof window !== "undefined" && window.location
>       ? window.location.hostname || ""
>       : "").toLowerCase();
>     return hn !== "" && hn !== "localhost" && hn !== "127.0.0.1" && hn !== "::1"
>       && !hn.startsWith("192.168.") && !hn.startsWith("10.")
>       && !hn.startsWith("172.16.") && !hn.startsWith("172.17.")
>       && !hn.startsWith("172.18.") && !hn.startsWith("172.19.")
>       && !hn.startsWith("172.2") && !hn.startsWith("172.30.")
>       && !hn.startsWith("172.31.") && !hn.endsWith(".local");
>   } catch {
>     return false;
>   }
> }
> 
> export function isServerIpPanelEnabled() {
>   return !isDeployedSite();
> }
> 
> function parseHostAndPort(rawInput) {
>   let str = (rawInput || "").trim();
>   let proto = (typeof window !== "undefined" && window.location.protocol === "https:") ? "https" : "http";
>   if (str.startsWith("https://")) {
>     proto = "https";
>     str = str.replace(/^https:\/\//i, "");
>   } else if (str.startsWith("http://")) {
>     proto = "http";
>     str = str.replace(/^http:\/\//i, "");
>   }
>   const slashIdx = str.indexOf('/');
>   if (slashIdx !== -1) {
>     str = str.slice(0, slashIdx);
>   }
>   str = str.trim();
> 
>   let host = str || "localhost";
>   let port = "3001";
> 
>   if (str.includes(":")) {
>     const parts = str.split(":").filter(Boolean);
>     host = parts[0] || "localhost";
>     const lastPort = parts[parts.length - 1];
>     if (lastPort && lastPort !== "5173" && lastPort !== "5174" && /^\d+$/.test(lastPort)) {
>       port = lastPort;
>     }
>   }
>   return { host, port, proto };
> }
> 
> export function getApiHost() {
>   try {
>     const hn = (typeof window !== "undefined" && window.location ? window.location.hostname || "" : "").toLowerCase();
>     const stored = localStorage.getItem(API_HOST_STORAGE_KEY);
>     if (stored?.trim()) {
>       const parsed = parseHostAndPort(stored).host;
>       if (hn && hn !== "localhost" && hn !== "127.0.0.1" && hn !== "::1") {
>         if (parsed === "localhost" || parsed === "127.0.0.1" || parsed === "::1") {
>           return hn;
>         }
>       }
>       return parsed;
>     }
>     if (hn && hn !== "localhost" && hn !== "127.0.0.1" && hn !== "::1") {
>       return hn;
>     }
>     return "localhost";
>   } catch {
>     return "localhost";
>   }
> }
> 
> export function setApiHost(rawHost) {
>   try {
>     const { host, port } = parseHostAndPort(rawHost);
>     localStorage.setItem(API_HOST_STORAGE_KEY, host);
>     if (port) localStorage.setItem("w2g_api_port", port);
>   } catch {
>     console.warn("Failed to save API host");
>   }
> }
> 
> export function getApiBaseUrl() {
>   // Deployed site: same-origin, ignore any stale localStorage host/port.
>   if (isDeployedSite()) return "/api";
>   const host = getApiHost();
>   let port = "3001";
>   try {
>     const storedPort = localStorage.getItem("w2g_api_port");
>     if (storedPort && storedPort !== "5173") port = storedPort;
>   } catch {}
>   return `http://${host}:${port}/api`;
> }
> 
> export async function testApiConnection() {
>   if (isDeployedSite()) {
>     try {
>       const res = await fetch("/", {
>         method: "GET",
>         signal: AbortSignal.timeout(5000),
>       });
>       if (res.ok) return { ok: true, message: "Connected to this site (same-origin /api)" };
>       return { ok: false, message: `Server responded with HTTP ${res.status}` };
>     } catch {
>       return { ok: false, message: "Cannot reach this site — check your connection" };
>     }
>   }
>   const host = getApiHost();
>   let port = "3001";
>   try {
>     const storedPort = localStorage.getItem("w2g_api_port");
>     if (storedPort && storedPort !== "5173") port = storedPort;
>   } catch {}
>   try {
>     const res = await fetch(`http://${host}:${port}/`, {
>       method: "GET",
>       signal: AbortSignal.timeout(5000),
>     });
>     if (res.ok) return { ok: true, message: `Connected to http://${host}:${port}` };
>     return { ok: false, message: `Server responded with HTTP ${res.status}` };
>   } catch {
>     return { ok: false, message: `Cannot reach http://${host}:${port} — check IP and that the backend is running` };
>   }
> }
> 
> // Auth Helpers
> //
> // Storage is deliberately layered: localStorage → sessionStorage → memory.
> // In-app browsers (Messenger/Instagram/Facebook WebViews), iOS/Android private
> // mode, and "block all cookies" either throw on access or return null. When
> // that happened, the sign-in itself succeeded but the session disappeared on the
> // very next read — so the auth guard bounced the user straight back to the
> // splash/onboarding screen. To the user that reads as "I tap Sign In and it
> // restarts from the beginning". A successful sign-in must at minimum survive for
> // the lifetime of the tab.
> const AUTH_STORAGE_KEY = "w2g_auth_state";
> 
> /** Most recent auth state for this tab. Valid even when web storage is unusable. */
> let cachedAuthState = null;
> 
> function readAuthStorage(key) {
>   try {
>     const fromLocal = localStorage.getItem(key);
>     if (fromLocal !== null) return fromLocal;
>   } catch {
>     // localStorage unavailable (private mode / blocked cookies) — try sessionStorage.
>   }
>   try {
>     return sessionStorage.getItem(key);
>   } catch {
>     return null;
>   }
> }
> 
> function writeAuthStorage(key, value) {
>   let persisted = false;
>   try {
>     localStorage.setItem(key, value);
>     persisted = true;
>   } catch {
>     // ignore — fall through to sessionStorage.
>   }
>   try {
>     sessionStorage.setItem(key, value);
>     persisted = true;
>   } catch {
>     // ignore — the in-memory cache still holds the session for this tab.
>   }
>   return persisted;
> }
> 
> function removeAuthStorage(key) {
>   try {
>     localStorage.removeItem(key);
>   } catch {
>     // ignore — storage was already unavailable.
>   }
>   try {
>     sessionStorage.removeItem(key);
>   } catch {
>     // ignore — storage was already unavailable.
>   }
> }
> 
> export function getStoredAuth() {
>   const stored = readAuthStorage(AUTH_STORAGE_KEY);
>   if (stored) {
>     try {
>       cachedAuthState = JSON.parse(stored);
>       return cachedAuthState;
>     } catch {
>       console.warn("Stored auth state is not valid JSON — ignoring it");
>     }
>   }
>   // Storage was empty or unreadable: fall back to this tab's in-memory session.
>   return cachedAuthState;
> }
> 
> export function setStoredAuth(authState) {
>   cachedAuthState = authState;
>   if (!writeAuthStorage(AUTH_STORAGE_KEY, JSON.stringify(authState))) {
>     console.warn(
>       "Browser storage is unavailable — staying signed in for this tab only; the session will not survive a reload."
>     );
>   }
> }
> 
> export function clearStoredAuth() {
>   cachedAuthState = null;
>   removeAuthStorage(AUTH_STORAGE_KEY);
> }
> 
> // Generic Fetcher
> // forceMockFallback = true (default for pre-login screens, kiosk) → returns mock on network error.
> // forceMockFallback = false (admin use) → returns null on any error so caller can properly render DEMO badge.
> async function fetchApi(endpoint, options) {
>   const forceMockFallback = options?.forceMockFallback === true;
>   const auth = getStoredAuth();
>   const headers = {
>     "Content-Type": "application/json",
>     ...(auth?.token ? { "Authorization": `Bearer ${auth.token}` } : {}),
>     ...options?.headers,
>   };
> 
>   try {
>     const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
>       headers,
>       ...options,
>     });
> 
>     if (!response.ok) {
>       console.warn(`API Error: ${response.status} ${response.statusText} for ${endpoint}`);
>       throw new Error(`HTTP ${response.status}`);
>     }
>     return await response.json();
>   } catch (err) {
>     console.info(`fetchApi failed for ${endpoint} (forceMockFallback=${forceMockFallback})`, err?.message || err);
>     if (forceMockFallback) {
>       return getMockData(endpoint);
>     }
>     // Admin mode: return null so caller correctly marks data as DEMO-only and shows DEMO badge.
>     return null;
>   }
> }
> 
> // Mock Data Resolver
> const MOCK_DATA_MAP = {
>   "/users": USERS,
>   "/kiosks": KIOSKS,
>   "/rewards": REWARDS,
>   "/transactions": TRANSACTIONS,
>   "/analytics/weekly": WEEKLY_DATA,
>   "/analytics/monthly": MONTHLY_DATA,
>   "/leaderboard": LEADERBOARD,
>   "/tasks": TASKS,
> };
> 
> function getMockData(endpoint) {
>   let result = null;
>   if (endpoint.startsWith("/users/")) {
>     result = USERS[0];
>   } else if (Object.hasOwn(MOCK_DATA_MAP, endpoint)) {
>     result = MOCK_DATA_MAP[endpoint];
>   }
>   return result;
> }
> 
> // ——— refreshCurrentUser helpers (extracted to reduce Cognitive Complexity ≤ 15) ———
> 
> function buildDisplayFullName(obj) {
>   if (!obj) return "";
>   if (obj.name) return obj.name;
>   const first = obj.firstName || "";
>   const last = obj.lastName || "";
>   return `${first} ${last}`.trim();
> }
> 
> function findAdminMatch(admins, userId, storedAdminId) {
>   if (!Array.isArray(admins)) return null;
>   return admins.find(a =>
>     a.adminId === userId || a.id === userId || a.adminId === storedAdminId
>   ) || null;
> }
> 
> function mergeFreshAdminData(authUser, match, userId) {
>   const fullName = buildDisplayFullName(match) || authUser.name;
>   return {
>     ...authUser,
>     id: match.adminId || userId,
>     adminId: match.adminId || authUser.adminId,
>     name: fullName,
>     firstName: match.firstName || authUser.firstName,
>     lastName: match.lastName || authUser.lastName,
>     email: match.email || match.adminIdentifier || authUser.email,
>     roleId: match.roleId ?? authUser.roleId ?? 1,
>     barangayId: match.barangayId ?? authUser.barangayId,
>   };
> }
> 
> function pickSubmissionCount(r) {
>   const direct = typeof r.submissions === "number" ? r.submissions : 0;
>   if (direct) return direct;
>   return typeof r.totalSubmissions === "number" ? r.totalSubmissions : 0;
> }
> 
> function formatJoinedDate(createdAt, fallback) {
>   if (!createdAt) return fallback;
>   return new Date(createdAt).toLocaleDateString("en-US", {
>     month: "short", day: "numeric", year: "numeric",
>   });
> }
> 
> function mergeFreshResidentData(authUser, r, userId) {
>   const fullName = buildDisplayFullName(r);
>   const submissions = pickSubmissionCount(r);
>   const pointsRaw = typeof r.points === "number" ? r.points : r.pointsBalance;
>   const points = pointsRaw ?? authUser.points;
>   const redeemed = typeof r.redeemed === "number" ? r.redeemed : 0;
>   const joined = formatJoinedDate(r.createdAt, authUser.joined);
>   const uid = r.userId || r.id || userId;
>   return {
>     ...authUser,
>     id: uid,
>     userId: uid,
>     name: fullName,
>     firstName: r.firstName,
>     lastName: r.lastName,
>     email: r.email || authUser.email,
>     phone: r.phone,
>     barangay: r.barangayName || r.barangay || authUser.barangay,
>     barangayName: r.barangayName || r.barangay,
>     province: r.province,
>     city: r.city,
>     streetAddress: r.streetAddress,
>     points,
>     pointsBalance: r.pointsBalance,
>     submissions,
>     totalSubmissions: submissions,
>     redeemed,
>     createdAt: r.createdAt,
>     joined,
>     status: r.status,
>     tier: r.tier,
>   };
> }
> 
> function persistFreshUser(auth, fresh) {
>   if (!fresh) return auth.user;
>   const next = { ...auth, user: fresh };
>   setStoredAuth(next);
>   return next.user;
> }
> 
> // API Methods
> export const Waste2GoodsAPI = {
>   // Auth
>   register: async (data) => {
>     // Registration ALWAYS goes through the real backend (no mock fallback).
>     // This ensures every new user is INSERTed into the MySQL/XAMPP database correctly.
>     try {
>       const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
>         method: "POST",
>         headers: { "Content-Type": "application/json" },
>         body: JSON.stringify(data),
>       });
>       if (!response.ok) {
>         const err = await response.json().catch(() => ({}));
>         throw new Error(err.error || "Registration failed");
>       }
>       const result = await response.json();
>       const authState = {
>         isAuthenticated: true,
>         user: result.user,
>         token: result.token,
>       };
>       setStoredAuth(authState);
>       return authState;
>     } catch (e) {
>       throw e instanceof Error ? e : new Error("Registration failed — check backend connection");
>     }
>   },
>   login: async (email, password) => {
>     // Login ALWAYS goes through the real backend (no demo shortcut fallbacks for residents).
>     // Admin login is still handled by the backend's hardcoded ADMIN_CREDENTIALS check.
>     try {
>       const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
>         method: "POST",
>         headers: { "Content-Type": "application/json" },
>         body: JSON.stringify({ email, password }),
>       });
>       if (!response.ok) {
>         const err = await response.json().catch(() => ({}));
>         throw new Error(err.error || "Login failed");
>       }
>       const result = await response.json();
>       const authState = {
>         isAuthenticated: true,
>         user: result.user,
>         token: result.token,
>       };
>       setStoredAuth(authState);
>       return authState;
>     } catch (e) {
>       throw e instanceof Error ? e : new Error("Login failed — check backend connection or credentials");
>     }
>   },
>   kioskLogin: async (pin) => {
>     // Try backend first, fall back to mock if fails
>     try {
>       const response = await fetch(`${getApiBaseUrl()}/auth/kiosk-login`, {
>         method: "POST",
>         headers: { "Content-Type": "application/json" },
>         body: JSON.stringify({ pin }),
>       });
>       if (!response.ok) {
>         throw new Error("API kiosk login failed");
>       }
>       const result = await response.json();
>       const authState = {
>         isAuthenticated: true,
>         user: result.user,
>         token: result.token,
>       };
>       setStoredAuth(authState);
>       return authState;
>     } catch {
>       // Fallback to mock
>       await new Promise(resolve => setTimeout(resolve, 500));
>       if (pin === KIOSK_PIN) {
>         const authState = {
>           isAuthenticated: true,
>           user: DEMO_KIOSK_USER,
>           token: "mock_kiosk_token_789",
>         };
>         setStoredAuth(authState);
>         return authState;
>       }
>       throw new Error("Invalid PIN");
>     }
>   },
>   logout: () => {
>     clearStoredAuth();
>   },
>   getAuthState: () => getStoredAuth(),
> 
>   // Profile refresh & save (see api.ts for docs)
>   async refreshCurrentUser() {
>     const auth = getStoredAuth();
>     if (!auth?.isAuthenticated || !auth?.user) return null;
>     const userId = auth.user.id || auth.user.userId;
>     if (!userId) return auth.user;
>     const isAdmin = auth.user.role === "admin" || auth.user.adminId;
> 
>     let fresh = null;
>     if (isAdmin) {
>       const admins = await fetchApi("/admin/admins");
>       const match = findAdminMatch(admins, userId, auth.user.adminId);
>       if (match) fresh = mergeFreshAdminData(auth.user, match, userId);
>     } else {
>       const resident = await fetchApi(`/users/${userId}`);
>       if (resident) fresh = mergeFreshResidentData(auth.user, resident, userId);
>     }
> 
>     return persistFreshUser(auth, fresh);
>   },
> 
>   async saveProfile(patches) {
>     const auth = getStoredAuth();
>     if (!auth?.isAuthenticated || !auth?.user) return false;
>     const userId = auth.user.id || auth.user.userId;
>     if (!userId) return false;
>     // Send 'password' as a plain field — backend is responsible for hashing it with bcrypt.
>     // Never construct fake "passwordHash" values client-side.
>     const body = { ...patches };
>     const result = await fetchApi(`/users/${userId}`, {
>       method: "PUT",
>       body: JSON.stringify(body),
>     });
>     if (result !== null) {
>       await this.refreshCurrentUser();
>       try {
>         window.dispatchEvent(new StorageEvent("storage", { key: "w2g_auth_state" }));
>       } catch { /* ignore */ }
>       return true;
>     }
>     return false;
>   },
> 
>   async getCurrentRank(authUserId) {
>     const auth = getStoredAuth();
>     const uid = authUserId || (auth?.user?.id || auth?.user?.userId);
>     if (!uid) return "#-";
>     const board = await fetchApi("/leaderboard");
>     if (!Array.isArray(board) || !board.length) return "#-";
>     const idx = board.findIndex(r => r.userId === uid || r.id === uid);
>     if (idx === -1) return "#-";
>     return `#${idx + 1}`;
>   },
> 
>   // Mobile notification bell: notifications for ONE logged-in resident
>   async getMyNotifications() {
>     const auth = getStoredAuth();
>     const userId = auth?.user?.id || auth?.user?.userId;
>     if (!userId) return { count: 0, unread: 0, items: [] };
>     const result = await fetchApi(`/users/${userId}/notifications`);
>     if (!result) return { count: 0, unread: 0, items: [], forUser: userId };
>     return {
>       forUser: result.forUser || userId,
>       count: Number(result.count || 0),
>       unread: Number(result.unread || 0),
>       items: Array.isArray(result.items) ? result.items : [],
>     };
>   },
> 
>   // Users
>   getUsers: () => fetchApi("/users"),
>   getUserById: (userId) => fetchApi(`/users/${userId}`),
>   updateUser: (userId, data) =>
>     fetchApi(`/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
> 
>   // Kiosks
>   getKiosks: () => fetchApi("/kiosks"),
> 
>   // Rewards
>   getRewards: () => fetchApi("/rewards"),
> 
>   // Transactions
>   getTransactions: () => fetchApi("/transactions"),
> 
>   // Analytics
>   getWeeklyData: () => fetchApi("/analytics/weekly"),
>   getMonthlyData: () => fetchApi("/analytics/monthly"),
>   getSummary: () => fetchApi("/analytics/summary"),
> 
>   // Leaderboard
>   getLeaderboard: () => fetchApi("/leaderboard"),
> 
>   // Tasks
>   getTasks: () => fetchApi("/tasks"),
> 
>   // Redemptions
>   getRedemptions: () => fetchApi("/redemptions"),
> 
>   // Admin Management
>   fetchAdminAdmins: () => fetchApi("/admin/admins"),
>   createAdmin: (data) => fetchApi("/admin/admins", { method: "POST", body: JSON.stringify(data) }),
>   deleteAdmin: (adminId) => fetchApi(`/admin/admins/${adminId}`, { method: "DELETE" }),
>   updateAdminStatus: (adminId, status = "archived") => fetchApi(`/admin/admins/${adminId}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
>   archiveAdmin: (adminId, status = "archived") => fetchApi(`/admin/admins/${adminId}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
> 
>   // Redeem
>   redeemReward: (data) => fetchApi("/rewards/redeem", { method: "POST", body: JSON.stringify(data) }),
> 
>   // Rewards CRUD (Admin)
>   createReward: (data) => fetchApi("/rewards", { method: "POST", body: JSON.stringify(data) }),
>   updateReward: (rewardId, data) => fetchApi(`/rewards/${rewardId}`, { method: "PUT", body: JSON.stringify(data) }),
>   deleteReward: (rewardId) => fetchApi(`/rewards/${rewardId}`, { method: "DELETE" }),
> 
>   // Users CRUD / Points Adjust (Admin)
>   createUser: (data) => fetchApi("/users", { method: "POST", body: JSON.stringify(data) }),
>   adjustUserPoints: (userId, delta, reason, adminId) =>
>     fetchApi(`/users/${userId}/points`, { method: "PUT", body: JSON.stringify({ delta, reason, adminId }) }),
> 
>   // Notifications feed
>   getNotifications: () => fetchApi("/notifications"),
>   fetchNotifications: () => fetchApi("/notifications"),
> 
>   // Kiosk operations (Admin)
>   calibrateKiosk: (kioskId) => fetchApi(`/kiosks/${kioskId}/calibrate`, { method: "POST" }),
>   getKioskLogs: (kioskId) => fetchApi(`/kiosks/${kioskId}/logs`),
> 
>   // Convenience aliases (fetchXYZ ↔ getXYZ naming for admin-panel parity)
>   fetchUsers: () => fetchApi("/users"),
>   fetchRewards: () => fetchApi("/rewards"),
>   fetchKiosks: () => fetchApi("/kiosks"),
>   fetchTransactions: () => fetchApi("/transactions"),
>   fetchAnalyticsWeekly: () => fetchApi("/analytics/weekly"),
>   fetchAnalyticsMonthly: () => fetchApi("/analytics/monthly"),
>   fetchAnalyticsSummary: () => fetchApi("/analytics/summary"),
>   fetchRedemptions: () => fetchApi("/redemptions"),
>   fetchLeaderboard: () => fetchApi("/leaderboard"),
> 
>   connectKioskSession: (data) =>
>     fetchApi("/kiosk/session/connect", { method: "POST", body: JSON.stringify(data) }),
>   pingKioskSession: (userId) =>
>     fetchApi("/kiosk/session/ping", { method: "POST", body: JSON.stringify({ userId }) }),
>   disconnectKioskSession: (userId) =>
>     fetchApi("/kiosk/session/disconnect", { method: "POST", body: JSON.stringify({ userId }) }),
>   getKioskSessionStatus: (userId) => fetchApi(`/kiosk/session/${userId}`),
> };

> **Attachment: attachment · txt · 35.5 KB**
>
> import {
>   User,
>   Kiosk,
>   Reward,
>   Transaction,
>   WeeklyData,
>   MonthlyData,
>   LeaderboardUser,
>   Task,
>   AuthUser,
>   AuthState,
> } from "./types";
> 
> let AppwriteSdk: any = null;
> try {
>   const mod = await import("appwrite");
>   AppwriteSdk = mod;
> } catch {
>   AppwriteSdk = null;
> }
> import {
>   USERS,
>   KIOSKS,
>   REWARDS,
>   TRANSACTIONS,
>   WEEKLY_DATA,
>   MONTHLY_DATA,
>   LEADERBOARD,
>   TASKS,
>   KIOSK_PIN,
>   DEMO_KIOSK_USER,
> } from "./constants";
> 
> // API Configuration.
> // Production (waste2goods.site, Cloudflare + Caddy): ALWAYS same-origin "/api".
> // The app is served from the same domain as the API, so no host, port, or
> // protocol configuration is needed. A stale localStorage host (e.g. a LAN IP
> // saved during development) must NEVER override this.
> // Local dev (localhost / LAN IP): keep the manual host override so phones on
> // Wi-Fi can point at the dev PC without a rebuild.
> const API_HOST_STORAGE_KEY = "w2g_api_host";
> const API_PORT_STORAGE_KEY = "w2g_api_port";
> const API_PROTOCOL_STORAGE_KEY = "w2g_api_protocol";
> 
> /** True when running from the deployed site (not localhost / LAN dev). */
> function isDeployedSite(): boolean {
>   try {
>     const hn = (typeof window !== "undefined" && window.location
>       ? window.location.hostname || ""
>       : "").toLowerCase();
>     return hn !== "" && hn !== "localhost" && hn !== "127.0.0.1" && hn !== "::1"
>       && !hn.startsWith("192.168.") && !hn.startsWith("10.")
>       && !hn.startsWith("172.16.") && !hn.startsWith("172.17.")
>       && !hn.startsWith("172.18.") && !hn.startsWith("172.19.")
>       && !hn.startsWith("172.2") && !hn.startsWith("172.30.")
>       && !hn.startsWith("172.31.") && !hn.endsWith(".local");
>   } catch {
>     return false;
>   }
> }
> 
> /** True when the "Backend Server IP" dev panel should be shown (local dev only). */
> export function isServerIpPanelEnabled(): boolean {
>   return !isDeployedSite();
> }
> 
> const STATIC_BASE_URL: string | undefined = (
>   typeof (import.meta as any)?.env?.VITE_API_BASE_URL === "string" && (import.meta as any).env.VITE_API_BASE_URL !== ""
> ) ? (import.meta as any).env.VITE_API_BASE_URL : undefined;
> 
> const DEFAULT_PROTOCOL =
>   (typeof (import.meta as any)?.env?.VITE_API_PROTOCOL === "string" && (import.meta as any).env.VITE_API_PROTOCOL) ||
>   (typeof window !== "undefined" && window.location.protocol === "https:" ? "https" : "http") ||
>   "http";
> 
> const DEFAULT_PORT =
>   (typeof (import.meta as any)?.env?.VITE_API_PORT === "string" && (import.meta as any).env.VITE_API_PORT) ||
>   (DEFAULT_PROTOCOL === "https" ? "" : "3001");
> 
> const DEFAULT_API_HOST =
>   (typeof (import.meta as any)?.env?.VITE_API_HOST === "string" && (import.meta as any).env.VITE_API_HOST) ||
>   "localhost";
> 
> function parseHostAndPort(rawInput: string): { host: string; port: string; proto: "http" | "https" } {
>   let str = (rawInput || "").trim();
>   let proto: "http" | "https" = (typeof window !== "undefined" && window.location.protocol === "https:") ? "https" : "http";
>   if (str.startsWith("https://")) {
>     proto = "https";
>     str = str.replace(/^https:\/\//i, "");
>   } else if (str.startsWith("http://")) {
>     proto = "http";
>     str = str.replace(/^http:\/\//i, "");
>   }
>   // Strip trailing slashes and paths like /api
>   const slashIdx = str.indexOf("/");
>   if (slashIdx !== -1) {
>     str = str.slice(0, slashIdx);
>   }
>   str = str.trim();
> 
>   let host = str || "localhost";
>   let port = String(DEFAULT_PORT || "3001");
> 
>   // Check if string contains port (e.g. 192.168.1.164:3001 or 192.168.1.164:5173:3001)
>   if (str.includes(":")) {
>     const parts = str.split(":").filter(Boolean);
>     host = parts[0] || "localhost";
>     const lastPort = parts[parts.length - 1];
>     // If user passed Vite dev server port 5173, change to backend port 3001
>     if (lastPort === "5173" || lastPort === "5174") {
>       port = "3001";
>     } else if (lastPort && /^\d+$/.test(lastPort)) {
>       port = lastPort;
>     }
>   }
> 
>   return { host, port, proto };
> }
> 
> export function getApiHost(): string {
>   try {
>     const hn = (typeof window !== "undefined" && window.location ? window.location.hostname || "" : "").toLowerCase();
>     const stored = localStorage.getItem(API_HOST_STORAGE_KEY);
>     if (stored?.trim()) {
>       const parsed = parseHostAndPort(stored).host;
>       // If we are on a real LAN device (not localhost), but stored host is localhost, prefer the real LAN hostname!
>       if (hn && hn !== "localhost" && hn !== "127.0.0.1" && hn !== "::1") {
>         if (parsed === "localhost" || parsed === "127.0.0.1" || parsed === "::1") {
>           return hn;
>         }
>       }
>       return parsed;
>     }
>     if (hn && hn !== "localhost" && hn !== "127.0.0.1" && hn !== "::1") {
>       return hn;
>     }
>     return DEFAULT_API_HOST;
>   } catch {
>     return DEFAULT_API_HOST;
>   }
> }
> 
> export function setApiHost(rawHost: string) {
>   try {
>     const { host, port, proto } = parseHostAndPort(rawHost);
>     localStorage.setItem(API_HOST_STORAGE_KEY, host);
>     if (port) localStorage.setItem(API_PORT_STORAGE_KEY, port);
>     localStorage.setItem(API_PROTOCOL_STORAGE_KEY, proto);
>   } catch {
>     console.warn("Failed to save API host");
>   }
> }
> 
> export function getApiPort(): string {
>   try {
>     const stored = localStorage.getItem(API_PORT_STORAGE_KEY);
>     if (stored != null && stored.trim() !== "") {
>       const p = stored.trim().replace(/^:/, "");
>       if (p === "5173" || p === "5174") return "3001";
>       return p;
>     }
>   } catch { /* ignore */ }
>   return String(DEFAULT_PORT || "3001");
> }
> 
> export function setApiPort(port: string) {
>   try { localStorage.setItem(API_PORT_STORAGE_KEY, String(port ?? "").replace(/^:/, "").trim()); } catch { /* ignore */ }
> }
> 
> export function getApiProtocol(): string {
>   try {
>     const stored = localStorage.getItem(API_PROTOCOL_STORAGE_KEY);
>     if (stored === "http" || stored === "https") return stored;
>   } catch { /* ignore */ }
>   return DEFAULT_PROTOCOL;
> }
> 
> export function setApiProtocol(proto: "http" | "https") {
>   try { localStorage.setItem(API_PROTOCOL_STORAGE_KEY, proto); } catch { /* ignore */ }
> }
> 
> export function getApiBaseUrl(): string {
>   // Deployed site (waste2goods.site): same-origin, ignore any stale localStorage.
>   // VITE_API_BASE_URL still wins when set at build time (Cloudflare Pages split).
>   if (isDeployedSite() && !STATIC_BASE_URL) return "/api";
>   if (STATIC_BASE_URL) {
>     if (STATIC_BASE_URL.startsWith("http://") || STATIC_BASE_URL.startsWith("https://") || STATIC_BASE_URL.startsWith("/")) {
>       return STATIC_BASE_URL.endsWith("/api") ? STATIC_BASE_URL : `${STATIC_BASE_URL.replace(/\/$/, "")}/api`;
>     }
>   }
>   const proto = getApiProtocol();
>   const host = getApiHost();
>   const port = getApiPort();
>   const portPart = port ? `:${port}` : "";
>   return `${proto}://${host}${portPart}/api`;
> }
> 
> export async function testApiConnection(): Promise<{ ok: boolean; message: string }> {
>   try {
>     if (isDeployedSite() && !STATIC_BASE_URL) {
>       const res = await fetch("/", { method: "GET", signal: AbortSignal.timeout(8000) });
>       if (res.ok) return { ok: true, message: "Connected to this site (same-origin /api)" };
>       return { ok: false, message: `Server responded with HTTP ${res.status}` };
>     }
>     if (STATIC_BASE_URL) {
>       const root = STATIC_BASE_URL.endsWith("/api") ? STATIC_BASE_URL.slice(0, -"/api".length) || "/" : "/";
>       let url = "/";
>       if (root.startsWith("http")) {
>         url = root.endsWith("/") ? root : root + "/";
>       }
>       const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) });
>       if (res.ok) return { ok: true, message: `Connected to ${url}` };
>       return { ok: false, message: `Server responded with HTTP ${res.status}` };
>     }
>   } catch { /* ignore, fall through to direct host:port check */ }
> 
>   const proto = getApiProtocol();
>   const host = getApiHost();
>   const port = getApiPort();
>   const portPart = port ? `:${port}` : "";
>   const url = `${proto}://${host}${portPart}/`;
>   try {
>     const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
>     if (res.ok) return { ok: true, message: `Connected to ${proto}://${host}${portPart}` };
>     return { ok: false, message: `Server responded with HTTP ${res.status}` };
>   } catch {
>     return { ok: false, message: `Cannot reach ${proto}://${host}${portPart} — check IP and that the backend is running on port ${port}` };
>   }
> }
> 
> // Auth Helpers
> //
> // Storage is deliberately layered: localStorage → sessionStorage → memory.
> // In-app browsers (Messenger/Instagram/Facebook WebViews), iOS/Android private
> // mode, and "block all cookies" either throw on access or return null. When
> // that happened, the sign-in itself succeeded but the session disappeared on the
> // very next read — so the auth guard bounced the user straight back to the
> // splash/onboarding screen. To the user that reads as "I tap Sign In and it
> // restarts from the beginning". A successful sign-in must at minimum survive for
> // the lifetime of the tab.
> const AUTH_STORAGE_KEY = "w2g_auth_state";
> 
> /** Most recent auth state for this tab. Valid even when web storage is unusable. */
> let cachedAuthState: AuthState | null = null;
> 
> function readAuthStorage(key: string): string | null {
>   try {
>     const fromLocal = localStorage.getItem(key);
>     if (fromLocal !== null) return fromLocal;
>   } catch {
>     // localStorage unavailable (private mode / blocked cookies) — try sessionStorage.
>   }
>   try {
>     return sessionStorage.getItem(key);
>   } catch {
>     return null;
>   }
> }
> 
> function writeAuthStorage(key: string, value: string): boolean {
>   let persisted = false;
>   try {
>     localStorage.setItem(key, value);
>     persisted = true;
>   } catch {
>     // ignore — fall through to sessionStorage.
>   }
>   try {
>     sessionStorage.setItem(key, value);
>     persisted = true;
>   } catch {
>     // ignore — the in-memory cache still holds the session for this tab.
>   }
>   return persisted;
> }
> 
> function removeAuthStorage(key: string): void {
>   try {
>     localStorage.removeItem(key);
>   } catch {
>     // ignore — storage was already unavailable.
>   }
>   try {
>     sessionStorage.removeItem(key);
>   } catch {
>     // ignore — storage was already unavailable.
>   }
> }
> 
> export function getStoredAuth(): AuthState | null {
>   const stored = readAuthStorage(AUTH_STORAGE_KEY);
>   if (stored) {
>     try {
>       cachedAuthState = JSON.parse(stored) as AuthState;
>       return cachedAuthState;
>     } catch {
>       console.warn("Stored auth state is not valid JSON — ignoring it");
>     }
>   }
>   // Storage was empty or unreadable: fall back to this tab's in-memory session.
>   return cachedAuthState;
> }
> 
> export function setStoredAuth(authState: AuthState): void {
>   cachedAuthState = authState;
>   if (!writeAuthStorage(AUTH_STORAGE_KEY, JSON.stringify(authState))) {
>     console.warn(
>       "Browser storage is unavailable — staying signed in for this tab only; the session will not survive a reload."
>     );
>   }
> }
> 
> export function clearStoredAuth(): void {
>   cachedAuthState = null;
>   removeAuthStorage(AUTH_STORAGE_KEY);
> }
> 
> // Generic Fetcher
> // Use options.forceMockFallback = true only for kiosk/mobile pre-login screens
> // where mock-data UX is acceptable. Admin endpoints leave this unset so
> // failures return null and caller correctly shows DEMO fallback badge.
> type FetchOpts = RequestInit & { forceMockFallback?: boolean };
> async function fetchApi<T>(endpoint: string, options?: FetchOpts): Promise<T | null> {
>   const forceMockFallback = options?.forceMockFallback === true;
>   const auth = getStoredAuth();
>   const headers = {
>     "Content-Type": "application/json",
>     ...(auth?.token ? { "Authorization": `Bearer ${auth.token}` } : {}),
>     ...options?.headers,
>   };
> 
>   try {
>     const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
>       headers,
>       ...options,
>     });
> 
>     if (!response.ok) {
>       console.warn(`API Error: ${response.status} ${response.statusText} for ${endpoint}`);
>       throw new Error(`HTTP ${response.status}`);
>     }
>     return await response.json() as T;
>   } catch (err) {
>     console.info(`fetchApi failed for ${endpoint} (forceMockFallback=${forceMockFallback})`, err);
>     if (forceMockFallback) {
>       return getMockData(endpoint) as T | null;
>     }
>     return null;
>   }
> }
> 
> // Mock Data Resolver
> function getMockData(endpoint: string) {
>   if (endpoint === "/users") return USERS;
>   if (endpoint.startsWith("/users/")) return USERS[0]; // default user for demo
>   if (endpoint === "/kiosks") return KIOSKS;
>   if (endpoint === "/rewards") return REWARDS;
>   if (endpoint === "/transactions") return TRANSACTIONS;
>   if (endpoint === "/analytics/weekly") return WEEKLY_DATA;
>   if (endpoint === "/analytics/monthly") return MONTHLY_DATA;
>   if (endpoint === "/leaderboard") return LEADERBOARD;
>   if (endpoint === "/tasks") return TASKS;
>   return null;
> }
> 
> // ——— refreshCurrentUser helpers (extracted to reduce Cognitive Complexity ≤ 15) ———
> 
> function buildDisplayFullName(obj: any): string {
>   if (!obj) return "";
>   if (obj.name) return String(obj.name);
>   const first = obj.firstName || "";
>   const last = obj.lastName || "";
>   return `${first} ${last}`.trim();
> }
> 
> function findAdminMatch(admins: any, userId: string, storedAdminId?: string): any {
>   if (!Array.isArray(admins)) return null;
>   return admins.find(a =>
>     a.adminId === userId || a.id === userId || a.adminId === storedAdminId
>   ) || null;
> }
> 
> function mergeFreshAdminData(authUser: AuthUser, match: any, userId: string): AuthUser {
>   const fullName = buildDisplayFullName(match) || authUser.name;
>   const a = authUser as any;
>   return {
>     ...authUser,
>     id: match.adminId || userId,
>     adminId: match.adminId || a.adminId,
>     name: fullName,
>     firstName: match.firstName || a.firstName,
>     lastName: match.lastName || a.lastName,
>     email: match.email || match.adminIdentifier || authUser.email,
>     roleId: match.roleId ?? a.roleId ?? 1,
>     barangayId: match.barangayId ?? a.barangayId,
>   } as AuthUser;
> }
> 
> function pickSubmissionCount(r: any): number {
>   const direct = typeof r.submissions === "number" ? r.submissions : 0;
>   if (direct) return direct;
>   return typeof r.totalSubmissions === "number" ? r.totalSubmissions : 0;
> }
> 
> function formatJoinedDate(createdAt: any, fallback: string | undefined): string | undefined {
>   if (!createdAt) return fallback;
>   return new Date(createdAt).toLocaleDateString("en-US", {
>     month: "short", day: "numeric", year: "numeric",
>   });
> }
> 
> function mergeFreshResidentData(authUser: AuthUser, resident: any, userId: string): AuthUser {
>   const r = resident as any;
>   const fullName = buildDisplayFullName(r);
>   const submissions = pickSubmissionCount(r);
>   const pointsRaw = typeof r.points === "number" ? r.points : r.pointsBalance;
>   const a = authUser as any;
>   const points = pointsRaw ?? a.points;
>   const redeemed = typeof r.redeemed === "number" ? r.redeemed : 0;
>   const joined = formatJoinedDate(r.createdAt, a.joined);
>   const uid = r.userId || r.id || userId;
>   return {
>     ...authUser,
>     id: uid,
>     userId: uid,
>     name: fullName,
>     firstName: r.firstName,
>     lastName: r.lastName,
>     email: r.email || authUser.email,
>     phone: r.phone,
>     barangay: r.barangayName || r.barangay || a.barangay,
>     barangayName: r.barangayName || r.barangay,
>     province: r.province,
>     city: r.city,
>     streetAddress: r.streetAddress,
>     points,
>     pointsBalance: r.pointsBalance,
>     submissions,
>     totalSubmissions: submissions,
>     redeemed,
>     createdAt: r.createdAt,
>     joined,
>     status: r.status,
>     tier: r.tier,
>   } as AuthUser;
> }
> 
> function persistFreshUser(auth: AuthState, fresh: AuthUser | null): AuthUser {
>   if (!fresh) return auth.user;
>   const next: AuthState = { ...auth, user: fresh };
>   setStoredAuth(next);
>   return next.user;
> }
> 
> // API Methods
> export const Waste2GoodsAPI = {
>   // Auth
>   register: async (data: { firstName: string; lastName: string; email: string; password: string; phone?: string; province?: string; city?: string; barangayName?: string; streetAddress?: string }) => {
>     // Registration ALWAYS goes through the real backend (no mock fallback).
>     // This ensures every new user is INSERTed into the MySQL/XAMPP database correctly.
>     try {
>       const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
>         method: "POST",
>         headers: { "Content-Type": "application/json" },
>         body: JSON.stringify(data),
>       });
>       if (!response.ok) {
>         const err = await response.json().catch(() => ({}));
>         throw new Error(err.error || "Registration failed");
>       }
>       const result = await response.json();
>       const authState: AuthState = {
>         isAuthenticated: true,
>         user: result.user,
>         token: result.token,
>       };
>       setStoredAuth(authState);
>       return authState;
>     } catch (e) {
>       throw e instanceof Error ? e : new Error("Registration failed — check backend connection");
>     }
>   },
>   login: async (email: string, password: string) => {
>     // Login ALWAYS goes through the real backend (no demo shortcut fallbacks for residents).
>     // Admin login is still handled by the backend's hardcoded ADMIN_CREDENTIALS check.
>     try {
>       const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
>         method: "POST",
>         headers: { "Content-Type": "application/json" },
>         body: JSON.stringify({ email, password }),
>       });
>       if (!response.ok) {
>         const err = await response.json().catch(() => ({}));
>         throw new Error(err.error || "Login failed");
>       }
>       const result = await response.json();
>       const authState: AuthState = {
>         isAuthenticated: true,
>         user: result.user,
>         token: result.token,
>       };
>       setStoredAuth(authState);
>       return authState;
>     } catch (e) {
>       throw e instanceof Error ? e : new Error("Login failed — check backend connection or credentials");
>     }
>   },
>   kioskLogin: async (pin: string) => {
>     // Try backend first, fall back to mock if fails
>     try {
>       const response = await fetch(`${getApiBaseUrl()}/auth/kiosk-login`, {
>         method: "POST",
>         headers: { "Content-Type": "application/json" },
>         body: JSON.stringify({ pin }),
>       });
>       if (!response.ok) {
>         throw new Error("API kiosk login failed");
>       }
>       const result = await response.json();
>       const authState: AuthState = {
>         isAuthenticated: true,
>         user: result.user,
>         token: result.token,
>       };
>       setStoredAuth(authState);
>       return authState;
>     } catch {
>       // Fallback to mock
>       await new Promise(resolve => setTimeout(resolve, 500));
>       if (pin === KIOSK_PIN) {
>         const authState: AuthState = {
>           isAuthenticated: true,
>           user: DEMO_KIOSK_USER,
>           token: "mock_kiosk_token_789",
>         };
>         setStoredAuth(authState);
>         return authState;
>       }
>       throw new Error("Invalid PIN");
>     }
>   },
>   logout: async () => {
>     try {
>       if (AppwriteSdk) {
>         Waste2GoodsAPI.appwrite.configure();
>         if (Waste2GoodsAPI.appwrite.account) {
>           try { await (Waste2GoodsAPI.appwrite.account as any).deleteSession("current"); } catch {}
>         }
>       }
>     } catch {}
>     clearStoredAuth();
>   },
>   getAuthState: () => getStoredAuth(),
> 
>   // ——— Appwrite SDK client + OAuth (Google / GitHub / any provider) ———
>   appwrite: {
>     client: null as any,
>     account: null as any,
>     configured: false,
>     endpoint: "",
>     projectId: "",
>     region: "",
> 
>     configure(opts: { endpoint?: string; projectId?: string; region?: string } = {}): boolean {
>       try {
>         const VITE: any = (import.meta as any)?.env !== undefined ? (import.meta as any).env : {};
>         const endpoint = opts.endpoint || VITE.VITE_APPWRITE_ENDPOINT || localStorage.getItem("w2g_appwrite_endpoint") || "https://cloud.appwrite.io/v1";
>         const projectId = opts.projectId || VITE.VITE_APPWRITE_PROJECT_ID || localStorage.getItem("w2g_appwrite_project") || "";
>         const region = opts.region || VITE.VITE_APPWRITE_REGION || localStorage.getItem("w2g_appwrite_region") || "fra";
>         if (!AppwriteSdk || !projectId) {
>           this.configured = false;
>           return false;
>         }
>         const { Client, Account } = AppwriteSdk;
>         const client = new Client().setEndpoint(endpoint).setProject(projectId);
>         const account = new Account(client);
>         this.client = client;
>         this.account = account;
>         this.endpoint = endpoint;
>         this.projectId = projectId;
>         this.region = region;
>         this.configured = true;
>         try { localStorage.setItem("w2g_appwrite_endpoint", endpoint); } catch {}
>         try { localStorage.setItem("w2g_appwrite_project", projectId); } catch {}
>         try { localStorage.setItem("w2g_appwrite_region", region); } catch {}
>         return true;
>       } catch {
>         this.configured = false;
>         return false;
>       }
>     },
> 
>     async getInfo(): Promise<{ configured: boolean; endpoint: string; projectId: string; region?: string; providers: string[] }> {
>       try {
>         this.configure();
>         const res = await fetch(`${getApiBaseUrl()}/auth/appwrite/info`).then(r => r.json()).catch(() => ({}));
>         return {
>           configured: this.configured || res.configured || false,
>           endpoint: this.endpoint || res.endpoint || "",
>           projectId: this.projectId || res.projectId || "",
>           region: this.region || res.region || "",
>           providers: res.providers || ["google", "github"],
>         };
>       } catch {
>         return { configured: this.configured || false, endpoint: this.endpoint, projectId: this.projectId, region: this.region, providers: ["google", "github"] };
>       }
>     },
> 
>     async initiateOAuth2(provider: string = "google", opts: { success?: string; failure?: string; scopes?: string[] } = {}): Promise<string | null> {
>       try {
>         if (!this.configure()) {
>           const fallbackUrl = `${getApiBaseUrl()}/auth/${provider}?return_to=${encodeURIComponent(opts.success || window.location.origin + "/")}`;
>           window.location.href = fallbackUrl;
>           return fallbackUrl;
>         }
>         const success = opts.success || window.location.origin + "/";
>         const failure = opts.failure || window.location.origin + "/#login";
>         const url = await (this.account as any).createOAuth2Session(provider, success, failure, opts.scopes);
>         if (url?.toString) window.location.href = url.toString();
>         return url;
>       } catch (err) {
>         // Appwrite SDK session could not be created — log the cause, then fall back to the backend OAuth endpoint
>         console.warn("Appwrite OAuth session failed, falling back to backend OAuth:", err);
>         try {
>           const fallbackUrl = `${getApiBaseUrl()}/auth/${provider}?return_to=${encodeURIComponent(opts.success || window.location.origin + "/")}`;
>           window.location.href = fallbackUrl;
>           return fallbackUrl;
>         } catch (fallbackErr) {
>           // Both Appwrite and the backend OAuth endpoint failed — nothing left to try, so return null
>           console.warn("Backend OAuth fallback failed:", fallbackErr);
>           return null;
>         }
>       }
>     },
> 
>     async loginGoogle(opts: { success?: string; failure?: string } = {}): Promise<void> {
>       const success = opts.success || window.location.origin + "/";
>       const failure = opts.failure || window.location.origin + "/#login";
>       await this.initiateOAuth2("google", { success, failure, scopes: ["profile", "email"] });
>     },
> 
>     async loginGithub(opts: { success?: string; failure?: string } = {}): Promise<void> {
>       const success = opts.success || window.location.origin + "/";
>       const failure = opts.failure || window.location.origin + "/#login";
>       await this.initiateOAuth2("github", { success, failure, scopes: ["read:user", "user:email"] });
>     },
> 
>     async getJwt(): Promise<string | null> {
>       try {
>         if (!this.configure()) return null;
>         const token = await (this.account as any).createJWT();
>         return (token as any)?.jwt || token || null;
>       } catch { return null; }
>     },
> 
>     async syncWithBackend(additional: { provider?: string } = {}): Promise<AuthState | null> {
>       try {
>         const jwt = await this.getJwt();
>         if (!jwt) throw new Error("No Appwrite session JWT available — log in with Appwrite first");
>         const response = await fetch(`${getApiBaseUrl()}/auth/appwrite/sync`, {
>           method: "POST",
>           headers: { "Content-Type": "application/json" },
>           body: JSON.stringify({
>             appwriteJwt: jwt,
>             provider: additional.provider || "appwrite",
>           }),
>         });
>         if (!response.ok) {
>           const e = await response.json().catch(() => ({}));
>           throw new Error(e.error || "Backend sync failed");
>         }
>         const payload = await response.json();
>         const user = payload.dbUser || payload.user || {};
>         const authState: AuthState = {
>           isAuthenticated: true,
>           user,
>           token: payload.accessToken,
>         };
>         try { Object.assign((authState as any), { refreshToken: payload.refreshToken, refreshFamilyId: payload.refreshFamilyId, appwriteUser: payload.appwriteUser }); } catch {}
>         setStoredAuth(authState);
>         return authState;
>       } catch (err) {
>         throw err instanceof Error ? err : new Error("Appwrite -> Platform sync failed");
>       }
>     },
> 
>     async whoAmI(): Promise<any> {
>       try {
>         if (!this.configure()) return null;
>         return await (this.account as any).get();
>       } catch { return null; }
>     },
>   },
> 
>   // ——— Profile refresh / save (Mobile + Admin "My Profile") ———
>   // Re-fetches the currently-logged-in user (resident) from GET /users/:id
>   // and updates localStorage so all UI components display the latest data
>   // (points, submissions, name, barangay, etc.) — fixes stale session data.
>   async refreshCurrentUser(): Promise<AuthState["user"] | null> {
>     const auth = getStoredAuth();
>     if (!auth?.isAuthenticated || !auth?.user) return null;
>     const userId = (auth.user as any).id || (auth.user as any).userId;
>     if (!userId) return auth.user;
>     const isAdmin = auth.user.role === "admin" || (auth.user as any).adminId;
> 
>     let fresh: AuthUser | null = null;
>     if (isAdmin) {
>       const admins = await fetchApi<any[]>("/admin/admins");
>       const match = findAdminMatch(admins, userId, (auth.user as any).adminId);
>       if (match) fresh = mergeFreshAdminData(auth.user, match, userId);
>     } else {
>       const resident = await fetchApi<User>(`/users/${userId}`);
>       if (resident) fresh = mergeFreshResidentData(auth.user, resident, userId);
>     }
> 
>     return persistFreshUser(auth, fresh);
>   },
> 
>   // For residents: save edits to profile, call refreshCurrentUser to sync UI,
>   // then dispatch StorageEvent so all open tabs + QR bridge sync too.
>   async saveProfile(patches: {
>     firstName?: string;
>     lastName?: string;
>     email?: string;
>     phone?: string;
>     province?: string;
>     city?: string;
>     barangayName?: string;
>     streetAddress?: string;
>     password?: string;
>   }): Promise<boolean> {
>     const auth = getStoredAuth();
>     if (!auth?.isAuthenticated || !auth?.user) return false;
>     const userId = (auth.user as any).id || (auth.user as any).userId;
>     if (!userId) return false;
>     const body: any = { ...patches };
>     if (patches.password) body.passwordHash = `hashed_${patches.password}`;
>     delete body.password;
>     const result = await fetchApi<any>(`/users/${userId}`, {
>       method: "PUT",
>       body: JSON.stringify(body),
>     });
>     if (result !== null) {
>       await this.refreshCurrentUser();
>       try {
>         window.dispatchEvent(new StorageEvent("storage", { key: "w2g_auth_state" }));
>       } catch { /* ignore */ }
>       return true;
>     }
>     return false;
>   },
> 
>   // Returns user's rank by points among the weekly leaderboard (defaults to the
>   // stored leaderboard endpoint). Returns "#-" if unknown. This avoids the
>   // hardcoded "#3 Weekly Rank" in the mobile profile header.
>   async getCurrentRank(authUserId?: string): Promise<string> {
>     const auth = getStoredAuth();
>     const uid = authUserId || (auth?.user as any)?.id || (auth?.user as any)?.userId;
>     if (!uid) return "#-";
>     const board = await fetchApi<LeaderboardUser[]>("/leaderboard");
>     if (!Array.isArray(board) || !board.length) return "#-";
>     const idx = board.findIndex(r => (r as any).userId === uid || (r as any).id === uid);
>     if (idx === -1) return "#-";
>     return `#${idx + 1}`;
>   },
> 
>   // Mobile notification bell: notifications for ONE logged-in resident
>   // (their submissions, redemptions, tasks, welcome/tier milestones).
>   // Calls GET /api/users/:userId/notifications — scoped ONLY to this user.
>   async getMyNotifications(): Promise<{ count: number; unread: number; items: any[]; forUser?: string } | null> {
>     const auth = getStoredAuth();
>     const userId = (auth?.user as any)?.id || (auth?.user as any)?.userId;
>     if (!userId) return { count: 0, unread: 0, items: [] };
>     const result = await fetchApi<any>(`/users/${userId}/notifications`);
>     if (!result) return { count: 0, unread: 0, items: [], forUser: userId };
>     return {
>       forUser: result.forUser || userId,
>       count: Number(result.count || 0),
>       unread: Number(result.unread || 0),
>       items: Array.isArray(result.items) ? result.items : [],
>     };
>   },
> 
>   // Users
>   getUsers: () => fetchApi<User[]>("/users"),
>   getUserById: (userId: string) => fetchApi<User>(`/users/${userId}`),
> 
>   // Kiosks
>   getKiosks: () => fetchApi<Kiosk[]>("/kiosks"),
> 
>   // Rewards
>   getRewards: () => fetchApi<Reward[]>("/rewards"),
> 
>   // Transactions
>   getTransactions: () => fetchApi<Transaction[]>("/transactions"),
>   createTransaction: (data: { userId: string; materialId?: number; weightKg: number; kioskId?: string }) =>
>     fetchApi<any>("/transactions", {
>       method: "POST",
>       body: JSON.stringify({
>         userId: data.userId,
>         materialId: data.materialId || 1,
>         weightKg: data.weightKg,
>         kioskId: data.kioskId || "K-01"
>       }),
>     }),
> 
>   // Analytics
>   getWeeklyData: () => fetchApi<WeeklyData[]>("/analytics/weekly"),
>   getMonthlyData: () => fetchApi<MonthlyData[]>("/analytics/monthly"),
>   getSummary: () => fetchApi<any>("/analytics/summary"),
> 
>   // Leaderboard
>   getLeaderboard: () => fetchApi<LeaderboardUser[]>("/leaderboard"),
> 
>   // Tasks
>   getTasks: () => fetchApi<Task[]>("/tasks"),
> 
>   // Redemptions
>   getRedemptions: () => fetchApi<any[]>("/redemptions"),
> 
>   // Admin Management (only usable by authenticated admins)
>   fetchAdminAdmins: () => fetchApi<any[]>("/admin/admins"),
>   createAdmin: (data: { firstName: string; lastName: string; email: string; password: string; barangayId?: number; roleId?: number }) =>
>     fetchApi<any>("/admin/admins", {
>       method: "POST",
>       body: JSON.stringify(data),
>     }),
>   deleteAdmin: (adminId: string) =>
>     fetchApi<any>(`/admin/admins/${adminId}`, {
>       method: "DELETE",
>     }),
>   updateAdminStatus: (adminId: string, status: "active" | "archived" = "archived") =>
>     fetchApi<any>(`/admin/admins/${adminId}/status`, {
>       method: "PUT",
>       body: JSON.stringify({ status }),
>     }),
>   archiveAdmin: (adminId: string, status: "active" | "archived" = "archived") =>
>     fetchApi<any>(`/admin/admins/${adminId}/status`, {
>       method: "PUT",
>       body: JSON.stringify({ status }),
>     }),
> 
>   // Redeem
>   redeemReward: (data: { userId: string; rewardId: number | string; quantity?: number }) =>
>     fetchApi<any>("/rewards/redeem", {
>       method: "POST",
>       body: JSON.stringify(data),
>     }),
> 
>   // Rewards CRUD (Admin)
>   createReward: (data: {
>     rewardName: string;
>     pointsCost: number;
>     stockQuantity?: number;
>     description?: string;
>     category?: string;
>     icon?: string;
>     isSeasonal?: 0 | 1 | boolean;
>     status?: string;
>   }) =>
>     fetchApi<any>("/rewards", {
>       method: "POST",
>       body: JSON.stringify(data),
>     }),
>   updateReward: (
>     rewardId: number | string,
>     data: {
>       rewardName?: string;
>       pointsCost?: number;
>       stockQuantity?: number;
>       description?: string;
>       category?: string;
>       icon?: string;
>       isSeasonal?: 0 | 1 | boolean;
>       status?: string;
>     }
>   ) =>
>     fetchApi<any>(`/rewards/${rewardId}`, {
>       method: "PUT",
>       body: JSON.stringify(data),
>     }),
>   deleteReward: (rewardId: number | string) =>
>     fetchApi<any>(`/rewards/${rewardId}`, { method: "DELETE" }),
> 
>   // Users CRUD / Points Adjust (Admin)
>   createUser: (data: {
>     firstName: string;
>     lastName: string;
>     email: string;
>     password: string;
>     barangayId?: number;
>     pointsBalance?: number;
>     phone?: string;
>     province?: string;
>     city?: string;
>     barangayName?: string;
>     streetAddress?: string;
>   }) =>
>     fetchApi<any>("/users", {
>       method: "POST",
>       body: JSON.stringify(data),
>     }),
>   updateUser: (
>     userId: string,
>     data: {
>       firstName?: string;
>       lastName?: string;
>       email?: string;
>       barangayId?: number;
>       pointsBalance?: number;
>       phone?: string;
>       province?: string;
>       city?: string;
>       barangayName?: string;
>       streetAddress?: string;
>       status?: string;
>       passwordHash?: string;
>     }
>   ) =>
>     fetchApi<any>(`/users/${userId}`, {
>       method: "PUT",
>       body: JSON.stringify(data),
>     }),
>   adjustUserPoints: (userId: string, delta: number, reason?: string, adminId?: string) =>
>     fetchApi<any>(`/users/${userId}/points`, {
>       method: "PUT",
>       body: JSON.stringify({ delta, reason, adminId }),
>     }),
> 
>   // Notifications feed
>   getNotifications: () => fetchApi<any>("/notifications"),
>   fetchNotifications: () => fetchApi<any>("/notifications"),
> 
>   // Kiosk operations (Admin)
>   calibrateKiosk: (kioskId: string) =>
>     fetchApi<any>(`/kiosks/${kioskId}/calibrate`, { method: "POST" }),
>   getKioskLogs: (kioskId: string) => fetchApi<any>(`/kiosks/${kioskId}/logs`),
> 
>   // Convenience aliases (fetchXYZ ↔ getXYZ naming for admin-panel parity)
>   fetchUsers: () => fetchApi<any[]>("/users"),
>   fetchRewards: () => fetchApi<any[]>("/rewards"),
>   fetchKiosks: () => fetchApi<any[]>("/kiosks"),
>   fetchTransactions: () => fetchApi<any[]>("/transactions"),
>   fetchAnalyticsWeekly: () => fetchApi<any[]>("/analytics/weekly"),
>   fetchAnalyticsMonthly: () => fetchApi<any[]>("/analytics/monthly"),
>   fetchAnalyticsSummary: () => fetchApi<any>("/analytics/summary"),
>   fetchRedemptions: () => fetchApi<any[]>("/redemptions"),
>   fetchLeaderboard: () => fetchApi<any[]>("/leaderboard"),
> 
>   // Kiosk ↔ mobile live session
>   connectKioskSession: (data: { userId: string; userName?: string; kioskId?: string }) =>
>     fetchApi<any>("/kiosk/session/connect", { method: "POST", body: JSON.stringify(data) }),
>   pingKioskSession: (userId: string) =>
>     fetchApi<any>("/kiosk/session/ping", { method: "POST", body: JSON.stringify({ userId }) }),
>   disconnectKioskSession: (userId: string) =>
>     fetchApi<any>("/kiosk/session/disconnect", { method: "POST", body: JSON.stringify({ userId }) }),
>   getKioskSessionStatus: (userId: string) =>
>     fetchApi<{ connected: boolean; kioskId?: string; userName?: string; connectedAt?: number }>(
>       `/kiosk/session/${userId}`
>     ),
> };

here

# Claude — Nov 20, 2026, 8:23 PM

Good news: your server already has the redeem endpoint. `machine-routes.js` includes `POST /api/machine/claim`, which checks the code, adds the points, marks it claimed and blocks double use. So only the frontend is missing. I'll put the new screen in its own file so your 1,900-line `App.tsx` needs only small edits.

**File: ScreenRedeemCode.tsx**

```tsx
import { useState } from "react";
import { Waste2GoodsAPI } from "@waste2goods/core";
import { ArrowLeft, AlertCircle, CheckCircle2, Hash, Info, Recycle, Sparkles } from "lucide-react";

type ClaimResult = { newBalance: number; pointsAwarded: number; bottles: number };

type Props = Readonly<{
  go: (s: "home") => void;
  onClaimed: (r: ClaimResult) => void;
}>;

const CODE_LENGTH = 8;

// Receipt codes are 8 letters/digits. Accept lowercase, spaces and dashes when typing or pasting.
function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

export default function ScreenRedeemCode({ go, onClaimed }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClaimResult | null>(null);

  const ready = code.length === CODE_LENGTH;

  const submit = async () => {
    if (!ready || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await Waste2GoodsAPI.claimMachineCode(code);
      const r: ClaimResult = {
        newBalance: Number(res.newBalance),
        pointsAwarded: Number(res.pointsAwarded),
        bottles: Number(res.bottles),
      };
      setResult(r);
      onClaimed(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not redeem the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode("");
    setError("");
    setResult(null);
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto"
      style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}
    >
      <div
        className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border"
        style={{ top: "var(--sat)" }}
      >
        <button type="button" onClick={() => go("home")}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h2 className="text-base font-black text-foreground">Redeem Receipt Code</h2>
          <p className="text-xs text-muted-foreground">Turn your bottle receipt into points</p>
        </div>
      </div>

      {result ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 overflow-y-auto">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary border-4 border-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-foreground">Points Added!</h2>
            <p className="text-5xl font-black text-primary tracking-tight">+{result.pointsAwarded} pts</p>
            <p className="text-muted-foreground text-sm mt-2">
              {result.bottles} bottle{result.bottles === 1 ? "" : "s"} recycled. Thank you!
            </p>
          </div>
          <div className="w-full max-w-md space-y-3">
            <div className="rounded-2xl border border-border bg-white p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Recycle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">New balance</p>
                <p className="font-black text-foreground">{result.newBalance.toLocaleString()} total points</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => go("home")}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors text-base"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full py-3 rounded-2xl border border-border font-bold text-foreground hover:bg-secondary transition-colors text-sm"
            >
              Redeem another code
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm text-foreground">Enter your receipt code</p>
                <p className="text-xs text-muted-foreground">8 letters or numbers, printed on your receipt</p>
              </div>
            </div>

            <input
              value={code}
              onChange={(e) => {
                setCode(cleanCode(e.target.value));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="ABCD2345"
              maxLength={CODE_LENGTH}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Receipt code"
              className="w-full px-4 py-4 rounded-xl border border-border bg-white text-center font-mono font-black text-2xl tracking-[0.3em] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              disabled={!ready || loading}
              onClick={submit}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors text-base disabled:opacity-50"
            >
              {loading ? "Redeeming..." : "Redeem Points"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 font-semibold leading-relaxed">
              Each receipt code works only once. Points are added to your account right away.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

```

The new screen is in `ScreenRedeemCode.tsx`. Here's how to hook it in.

**1. Add the new file.** Copy `ScreenRedeemCode.tsx` into `packages/mobile-app/src/app/`, next to `App.tsx`.

**2. Add the API call in both core files.** In `packages/core/src/api.ts` and `packages/core/src/api.js`, find this line and paste the block right after it:

```ts
  getAuthState: () => getStoredAuth(),
```

```ts
  // Resident enters the 8-character receipt code printed by the machine.
  claimMachineCode: async (code: string) => {
    const auth = getStoredAuth();
    const response = await fetch(`${getApiBaseUrl()}/machine/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify({ code }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Could not redeem the code (HTTP ${response.status})`);
    }
    return data as { ok: boolean; bottles: number; pointsAwarded: number; newBalance: number; message: string };
  },
```

In `api.js`, delete the type part: write `async (code) =>` and `return data;`. I used a separate `fetch` instead of `fetchApi` because `fetchApi` hides the server's message. This way the resident sees "This code was already used" or "This code has expired".

**3. Edit `App.tsx` in six places**

a. Add the import after the `} from "lucide-react";` line:
```tsx
import ScreenRedeemCode from "./ScreenRedeemCode";
```

b. In the `MobileScreen` type, change `| "leaderboard";` to:
```tsx
  | "leaderboard" | "redeem-code";
```

c. In `MobileAppRouterProps`, add a line after `onSubmitConfirm: () => void;`:
```tsx
  onClaimed: (r: { newBalance: number; pointsAwarded: number; bottles: number }) => void;
```

d. In `MobileScreenContent`, add this line after the `case "leaderboard":` line:
```tsx
    case "redeem-code": return <ScreenRedeemCode go={p.go} onClaimed={p.onClaimed} />;
```

e. In `ScreenHome`, paste this button directly above the `{p.kioskSession.connected && (` line:
```tsx
        <button type="button" onClick={() => p.go("redeem-code")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-primary/40 hover:bg-green-50 transition-colors text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Hash className="w-5 h-5 text-primary" /></div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">Redeem Receipt Code</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Enter the code from the bottle machine</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
```

f. In `App()`, paste this handler just above the final `return (`, and add `onClaimed={onClaimed}` after `onSubmitConfirm={onSubmitConfirm}` in the `<MobileScreens ... />` props:
```tsx
  const onClaimed = (r: { newBalance: number; pointsAwarded: number; bottles: number }) => {
    patchAuthBalance(r.newBalance);
    setProfileUser((prev: any) => ({
      ...(prev || currentUser),
      points: r.newBalance,
      pointsBalance: r.newBalance,
      submissions: Number(currentUser.submissions || 0) + 1,
    }));
  };
```

**4. Test locally, then deploy.** Run the app locally and send a test deposit with the `Invoke-RestMethod` command from before. Then log in as a resident and enter the code, and the points should go up. After that:

```powershell
git add packages/core packages/mobile-app
git commit -m "Add receipt code redeem screen"
git push
```

Then on the droplet, run `sudo -u deploy git pull` and `docker compose up -d --build`.

**Two things to know**
- Only accounts with the `resident` role can redeem. An admin account will get "Only a logged-in resident can claim a receipt code".
- The existing "Redeem Rewards" button (`onRewardRedeem`) only changes the balance on the phone and never calls the server, so that deduction disappears after a refresh. Receipt-code points are saved in the database, so they stay. Do you want me to wire the rewards redemption to the server next?

# Human — Nov 20, 2026, 8:25 PM

paki explain wako kasabot 
2. Add the API call in both core files. In `packages/core/src/api.ts` and `packages/core/src/api.js`, find this line and paste the block right after it:
ts

```ts
  getAuthState: () => getStoredAuth(),
```

ts

```ts
  // Resident enters the 8-character receipt code printed by the machine.
  claimMachineCode: async (code: string) => {
    const auth = getStoredAuth();
    const response = await fetch(`${getApiBaseUrl()}/machine/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify({ code }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Could not redeem the code (HTTP ${response.status})`);
    }
    return data as { ok: boolean; bottles: number; pointsAwarded: number; newBalance: number; message: string };
  },
```

In `api.js`, delete the type part: write `async (code) =>` and `return data;`. I used a separate `fetch` instead of `fetchApi` because `fetchApi` hides the server’s message. This way the resident sees “This code was already used” or “This code has expired”.

# Claude — Nov 20, 2026, 8:26 PM

Here is step 2 in simpler terms.

**What this step does**

Your app talks to the server through one shared file, `Waste2GoodsAPI`. We're adding one new function there, `claimMachineCode`. The new screen calls it when the resident presses "Redeem Points". It sends the 8-character code to the server (`/api/machine/claim`) and returns the points.

**Why two files?**

Your project has the same API code in two versions: `api.ts` (TypeScript) and `api.js` (JavaScript). Add the function to both so they stay the same.

**How to do it, in `api.ts`**

1. Open `packages/core/src/api.ts`.
2. Press `Ctrl+F` and search for `getAuthState`.
3. You'll find this line near the middle of the file:
   ```ts
     getAuthState: () => getStoredAuth(),
   ```
4. Put your cursor at the end of that line, press Enter, and paste the new function below it. It should look like this:

```ts
  getAuthState: () => getStoredAuth(),

  // Resident enters the 8-character receipt code printed by the machine.
  claimMachineCode: async (code: string) => {
    const auth = getStoredAuth();
    const response = await fetch(`${getApiBaseUrl()}/machine/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify({ code }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Could not redeem the code (HTTP ${response.status})`);
    }
    return data as { ok: boolean; bottles: number; pointsAwarded: number; newBalance: number; message: string };
  },

  // Profile refresh & save ...  (the next function that was already there)
```

Make sure the new block ends with `},`. The comma is needed because more functions follow it.

**Now `api.js`**

`api.js` is plain JavaScript and doesn't allow types like `code: string`. So do the same steps in `packages/core/src/api.js`, but paste this version:

```js
  getAuthState: () => getStoredAuth(),

  // Resident enters the 8-character receipt code printed by the machine.
  claimMachineCode: async (code) => {
    const auth = getStoredAuth();
    const response = await fetch(`${getApiBaseUrl()}/machine/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify({ code }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Could not redeem the code (HTTP ${response.status})`);
    }
    return data;
  },
```

The only differences are `(code)` instead of `(code: string)` and `return data;` at the end.

**What the function does, line by line**

- `getStoredAuth()` gets the logged-in user's token.
- `fetch(.../machine/claim)` sends the code to the server, with the token so the server knows who is redeeming.
- If the server says no (wrong code, already used, expired), `throw new Error(...)` passes the server's message to the screen, so the resident sees "This code was already used".
- If it says yes, the function returns the result: points added, bottles and the new balance.

When you've pasted it in both files, tell me and we'll continue with step 3 (`App.tsx`). If you'd like, you can also paste your edited `api.ts` here and I'll check it first.

# Human — Nov 20, 2026, 8:28 PM

next

# Claude — Nov 20, 2026, 8:29 PM

Step 3 is editing `packages/mobile-app/src/app/App.tsx`. There are 6 small edits. Use `Ctrl+F` to find each spot, and do them in order.

Before you start, make sure `ScreenRedeemCode.tsx` is copied into the same folder as `App.tsx` (`packages/mobile-app/src/app/`).

**Edit 1: import the new screen**

Search for `from "lucide-react";`. It ends the big import block at the top. Right below that line, add:

```tsx
import ScreenRedeemCode from "./ScreenRedeemCode";
```

**Edit 2: add the new screen name**

Search for `| "leaderboard";` and change it to:

```tsx
  | "leaderboard" | "redeem-code";
```

**Edit 3: add a prop to the type**

Search for `onSubmitConfirm: () => void;`. Add this line right below it:

```tsx
  onClaimed: (r: { newBalance: number; pointsAwarded: number; bottles: number }) => void;
```

**Edit 4: show the screen**

Search for `case "leaderboard": return <ScreenLeaderboard {...p} />;`. Add this line right below it:

```tsx
    case "redeem-code": return <ScreenRedeemCode go={p.go} onClaimed={p.onClaimed} />;
```

**Edit 5: add the button on the Home screen**

Search for `{p.kioskSession.connected && (`. Paste this block directly above that line:

```tsx
        <button type="button" onClick={() => p.go("redeem-code")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-primary/40 hover:bg-green-50 transition-colors text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Hash className="w-5 h-5 text-primary" /></div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">Redeem Receipt Code</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Enter the code from the bottle machine</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
```

**Edit 6: two small pieces near the bottom, in `App()`**

First, search for `const onSubmitConfirm = () => {`. After that function ends, and just above the last `return (`, paste:

```tsx
  const onClaimed = (r: { newBalance: number; pointsAwarded: number; bottles: number }) => {
    patchAuthBalance(r.newBalance);
    setProfileUser((prev: any) => ({
      ...(prev || currentUser),
      points: r.newBalance,
      pointsBalance: r.newBalance,
      submissions: Number(currentUser.submissions || 0) + 1,
    }));
  };
```

Second, search for `onSubmitConfirm={onSubmitConfirm}`. It's in the `<MobileScreens ... />` part. Add this line right below it:

```tsx
        onClaimed={onClaimed}
```

**What each edit does**

- Edits 1–4 teach the app that a new screen exists.
- Edit 5 adds the button residents tap on Home.
- Edit 6 updates the points shown on the phone right after a successful redeem, so you don't need to refresh.

**Check your work.** Save the files. If VS Code shows red underlines, the usual causes are:
- `claimMachineCode does not exist`: step 2 wasn't saved in `api.ts`.
- `Cannot find module './ScreenRedeemCode'`: the file isn't in the same folder as `App.tsx`.

Tell me when you're done, and then we'll test it. You can also paste any error you see.

# Human — Nov 20, 2026, 8:38 PM

**Attachment: 1795178326401_image.png · image**

![1795178326401_image.png](https://claude.ai/api/b2b2b9bf-faed-49b2-9aa8-3cc71efe14b0/files/69637a2d-ed12-4ac9-8a4b-67e6f48778f7/preview)

it's error tho

# Claude — Nov 20, 2026, 8:38 PM

The error is only a placement problem. You pasted the new button below the `{p.kioskSession.connected && (` line (line 1833), so it landed inside that condition. It needs to go above that line.

**How to fix it**

1. Select lines **1834 to 1841**. That is the whole new block, from `<button type="button" onClick={() => p.go("redeem-code")}` to its closing `</button>`.
2. Cut it with `Ctrl+X`.
3. Put your cursor at the very start of line **1833**, the line that begins with `{p.kioskSession.connected && (`.
4. Paste with `Ctrl+V`, and press Enter if the lines run together.

After the fix, that area should look like this:

```tsx
        </div>                                   ← the closing </div> of the 4-button grid (line 1832)

        <button type="button" onClick={() => p.go("redeem-code")} ...>
          ...
        </button>                                ← the end of my new block

        {p.kioskSession.connected && (           ← this line must come AFTER my block
          <button type="button" onClick={p.handleDisconnectKiosk} ...>
```

The order should be: the grid's `</div>`, then my new button, then the `{p.kioskSession.connected && (` block.

The red underlines should disappear after you save. If any remain, check that lines 1852–1853 still read `)}`, the end of the `kioskSession` block. If one of them got deleted or changed by accident, restore it.

Also check that `Hash` and `ChevronRight` are in your `lucide-react` import at the top. They already are in your file, so there's nothing to add.

Tell me if the errors are gone, or send another screenshot, and then we'll do Edit 6.

# Human — Nov 20, 2026, 8:40 PM

**Attachment: 1795178430686_image.png · image**

![1795178430686_image.png](https://claude.ai/api/b2b2b9bf-faed-49b2-9aa8-3cc71efe14b0/files/11b9e9c6-1ac2-48fe-8d23-2aedb29be152/preview)

**Attachment: 1795178450739_image.png · image**

![1795178450739_image.png](https://claude.ai/api/b2b2b9bf-faed-49b2-9aa8-3cc71efe14b0/files/7df74931-4699-48ba-9436-2833b1831b5d/preview)

still error

# Claude — Nov 20, 2026, 8:41 PM

Both errors are expected and simple to fix.

**Error 1: "JSX expressions must have one parent element" (line 1833)**

The new button ended up on the same line as `{p.kioskSession.connected && (`, so it is still inside that block. The fix is to replace the whole block with the correct version.

1. Select everything from the line `{p.kioskSession.connected && (` down to the `)}` line just above `<div className="space-y-3">`. That's about lines 1833 to 1852, and includes both buttons.
2. Delete it and paste this in its place:

```tsx
        <button type="button" onClick={() => p.go("redeem-code")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-primary/40 hover:bg-green-50 transition-colors text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Hash className="w-5 h-5 text-primary" /></div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">Redeem Receipt Code</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Enter the code from the bottle machine</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        {p.kioskSession.connected && (
          <button type="button" onClick={p.handleDisconnectKiosk} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center"><Cable className="w-4 h-4 text-emerald-900" /></div>
              <div className="text-left">
                <p className="text-xs font-black">Linked to {p.kioskSession.kioskId || "kiosk"}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">{p.kioskElapsedLabel || "Active session"}{p.kioskChecking ? " · checking..." : ""}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-400 text-emerald-900 px-2 py-1 rounded-full">Tap to disconnect</span>
          </button>
        )}
```

The block above is your original kiosk button with the new Redeem button placed before it. The line right after the pasted `)}` should be `<div className="space-y-3">`.

**Error 2: "Property 'onClaimed' is missing" (line 3222)**

This one is just Edit 6, which isn't finished yet. The type says `<MobileScreens>` needs an `onClaimed` prop, but it isn't passed yet. Do both parts of Edit 6:

1. Search for `onSubmitConfirm={onSubmitConfirm}` and add this line right below it:
   ```tsx
           onClaimed={onClaimed}
   ```
2. Check that the handler exists. Search for `const onClaimed`. If nothing is found, paste this just above the last `return (` in `App()`, after the `onSubmitConfirm` function:
   ```tsx
     const onClaimed = (r: { newBalance: number; pointsAwarded: number; bottles: number }) => {
       patchAuthBalance(r.newBalance);
       setProfileUser((prev: any) => ({
         ...(prev || currentUser),
         points: r.newBalance,
         pointsBalance: r.newBalance,
         submissions: Number(currentUser.submissions || 0) + 1,
       }));
     };
   ```

Save the file. The Problems panel should then show 0 errors. If anything remains, send a new screenshot of the panel.

# Human — Nov 20, 2026, 8:43 PM

so just delete this?

```typescriptreact
  {p.kioskSession.connected && ( <button type="button" onClick={() => p.go("redeem-code")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-primary/40 hover:bg-green-50 transition-colors text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Hash className="w-5 h-5 text-primary" /></div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">Redeem Receipt Code</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Enter the code from the bottle machine</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
            <button type="button" onClick={p.handleDisconnectKiosk} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center"><Cable className="w-4 h-4 text-emerald-900" /></div>
              <div className="text-left">
                <p className="text-xs font-black">Linked to {p.kioskSession.kioskId || "kiosk"}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">{p.kioskElapsedLabel || "Active session"}{p.kioskChecking ? " · checking..." : ""}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-400 text-emerald-900 px-2 py-1 rounded-full">Tap to disconnect</span>
          </button>
        )}
```

# Claude — Nov 20, 2026, 8:43 PM

Yes. Delete that whole block, from `{p.kioskSession.connected && (` down to its closing `)}`, and paste the block below in its place. The problem was that my Redeem button sat inside the `kioskSession.connected` condition, so it would only show when a kiosk is linked.

```tsx
        <button type="button" onClick={() => p.go("redeem-code")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-primary/40 hover:bg-green-50 transition-colors text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Hash className="w-5 h-5 text-primary" /></div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">Redeem Receipt Code</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Enter the code from the bottle machine</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        {p.kioskSession.connected && (
          <button type="button" onClick={p.handleDisconnectKiosk} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center"><Cable className="w-4 h-4 text-emerald-900" /></div>
              <div className="text-left">
                <p className="text-xs font-black">Linked to {p.kioskSession.kioskId || "kiosk"}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">{p.kioskElapsedLabel || "Active session"}{p.kioskChecking ? " · checking..." : ""}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-400 text-emerald-900 px-2 py-1 rounded-full">Tap to disconnect</span>
          </button>
        )}
```

**What changed from yours**

- The Redeem button now stands by itself, so it always shows.
- `{p.kioskSession.connected && (` now wraps only the green disconnect button, as in your original code.

Right after the pasted `)}`, the next line should be `<div className="space-y-3">`. That is the "Community Leaderboard" part that was already there.

Save the file. The first error, "JSX expressions must have one parent element", should be gone. The second error (`onClaimed` missing) goes away when you finish Edit 6. If it's still there, check whether you added both parts: the `const onClaimed = ...` function, and the `onClaimed={onClaimed}` line under `onSubmitConfirm={onSubmitConfirm}`.

# Human — Nov 20, 2026, 8:44 PM

**Attachment: 1795178641510_image.png · image**

![1795178641510_image.png](https://claude.ai/api/b2b2b9bf-faed-49b2-9aa8-3cc71efe14b0/files/a657839c-ae0d-4606-bbc2-4a0aec16bb47/preview)

[{
	"resource": "/c:/Users/USER/Downloads/Gamified Recycling Platform Prototype/packages/mobile-app/src/app/App.tsx",
	"owner": "typescript",
	"code": "2741",
	"severity": 8,
	"message": "Property 'onClaimed' is missing in type '{ screen: MobileScreen; leaderTab: \"weekly\" | \"monthly\"; regStep: number; selectedReward: { id: number; name: string; points: number; cost: number; category: string; stock: number; ... 4 more ...; validity: string; }; ... 84 more ...; go: (s: MobileScreen) => void; }' but required in type 'Readonly<{ screen: MobileScreen; leaderTab: \"weekly\" | \"monthly\"; regStep: number; selectedReward: { id: number; name: string; points: number; cost: number; category: string; stock: number; ... 4 more ...; validity: string; }; ... 85 more ...; go: (s: MobileScreen) => void; }>'.",
	"source": "ts",
	"startLineNumber": 3219,
	"startColumn": 8,
	"endLineNumber": 3219,
	"endColumn": 21,
	"relatedInformation": [
		{
			"startLineNumber": 1060,
			"startColumn": 3,
			"endLineNumber": 1060,
			"endColumn": 12,
			"message": "'onClaimed' is declared here.",
			"resource": "/c:/Users/USER/Downloads/Gamified Recycling Platform Prototype/packages/mobile-app/src/app/App.tsx"
		}
	],
	"origin": "extHost1"
}]

# Claude — Nov 20, 2026, 8:44 PM

Good news: the first error (JSX parent element) is gone. Only one error remains, and it's Edit 6, which isn't done yet. The error says `MobileScreens` needs the `onClaimed` prop, and it isn't being passed yet.

Your screenshot shows the area. You can see `go("submit-done");` and `};` at the top, then `return (`.

**Part A: add the handler**

Click at the end of the `};` line (the one just above `return (`), press Enter twice, and paste:

```tsx
  const onClaimed = (r: { newBalance: number; pointsAwarded: number; bottles: number }) => {
    patchAuthBalance(r.newBalance);
    setProfileUser((prev: any) => ({
      ...(prev || currentUser),
      points: r.newBalance,
      pointsBalance: r.newBalance,
      submissions: Number(currentUser.submissions || 0) + 1,
    }));
  };
```

It should then read: the `};` of `onSubmitConfirm`, a blank line, the new `onClaimed` function, a blank line, and `return (`.

**Part B: pass it to `<MobileScreens>`**

1. Press `Ctrl+F` and search for `onSubmitConfirm={onSubmitConfirm}`. It's further down inside `<MobileScreens ... />`, near the end of the long list of props.
2. Put your cursor at the end of that line, press Enter, and type or paste:

```tsx
        onClaimed={onClaimed}
```

It should end up like this:

```tsx
        onRewardClose={onRewardClose}
        onSubmitConfirm={onSubmitConfirm}
        onClaimed={onClaimed}
        go={go}
      />
```

Save the file. The red underline on `<MobileScreens` and the error in the Problems panel should disappear.

Then try it locally:

1. Run the app, log in as a resident, and open the Home screen. You should see the "Redeem Receipt Code" button.
2. Send a test deposit to your local server with the `Invoke-RestMethod` command from earlier (`test-0001` with code `TEST2345`).
3. In the app, tap Redeem Receipt Code, enter `TEST2345`, and press Redeem Points. You should see "+15 pts".

Tell me what happens, or send the Problems panel again if there are still errors.

# Human — Nov 20, 2026, 8:45 PM

where here?

```typescriptreact
<MobileScreens
        screen={screen}
        leaderTab={leaderTab}
        regStep={regStep}
        selectedReward={selectedReward}
        rewardFilter={rewardFilter}
        mfaCode={mfaCode}
        weighing={weighing}
        email={email}
        password={password}
        loginError={loginError}
        loginLoading={loginLoading}
        regFullName={regFullName}
        regEmail={regEmail}
        regPassword={regPassword}
        regConfirmPassword={regConfirmPassword}
        regPhone={regPhone}
        regProvince={regProvince}
        regCity={regCity}
        regBarangay={regBarangay}
        regStreetAddress={regStreetAddress}
        regLoading={regLoading}
        regError={regError}
        profileUser={profileUser}
        profileRank={profileRank}
        profileSaving={profileSaving}
        profileBanner={profileBanner}
        setFName={setFName}
        setLName={setLName}
        setFormEmail={setFormEmail}
        setPhone={setPhone}
        setProvince={setProvince}
        setCity={setCity}
        setBrgy={setBrgy}
        showLoginServer={showLoginServer}
        loginServerBanner={loginServerBanner}
        apiHost={apiHost}
        weight={weight}
        kioskSession={kioskSession}
        kioskChecking={kioskChecking}
        kioskElapsedLabel={kioskElapsedLabel}
        mergedLeaderboard={mergedLeaderboard}
        currentUser={currentUser}
        notifItems={notifItems}
        notifUnread={notifUnread}
        rewardCategories={rewardCategories}
        filteredRewards={filteredRewards}
        profileSinceLabel={profileSinceLabel}
        availableCities={availableCities}
        availableBarangays={availableBarangays}
        mfaRefs={mfaRefs}
        setLeaderTab={setLeaderTab}
        setRegStep={setRegStep}
        setSelectedReward={setSelectedReward}
        setRewardFilter={setRewardFilter}
        setMfaCode={setMfaCode}
        setEmail={setEmail}
        setPassword={setPassword}
        setRegFullName={setRegFullName}
        setRegEmail={setRegEmail}
        setRegPassword={setRegPassword}
        setRegConfirmPassword={setRegConfirmPassword}
        setRegPhone={setRegPhone}
        setRegProvince={setRegProvince}
        setRegCity={setRegCity}
        setRegBarangay={setRegBarangay}
        setRegStreetAddress={setRegStreetAddress}
        setRegError={setRegError}
        setProfileBanner={setProfileBanner}
        setSetFName={setSetFName}
        setSetLName={setSetLName}
        setSetFormEmail={setSetFormEmail}
        setSetPhone={setSetPhone}
        setSetProvince={setSetProvince}
        setSetCity={setSetCity}
        setSetBrgy={setSetBrgy}
        setLoginServerBanner={setLoginServerBanner}
        setApiHost={setApiHost}
        handleSaveProfile={handleSaveProfile}
        handleDisconnectKiosk={handleDisconnectKiosk}
        onLogin={onLogin}
        onRegisterStep1Next={onRegisterStep1Next}
        onRegisterStep2Next={onRegisterStep2Next}
        onRegisterStep3MFA={onRegisterStep3MFA}
        onRegisterStep3Skip={onRegisterStep3Skip}
        onToggleLoginServer={onToggleLoginServer}
        onRewardRedeem={onRewardRedeem}
        onRewardClose={onRewardClose}
        onSubmitConfirm={onSubmitConfirm}
        go={go}
      />
    </div>
  );
```

# Claude — Nov 20, 2026, 8:45 PM

Add it right after `onSubmitConfirm={onSubmitConfirm}`, near the bottom of that block. The end of the block should look like this:

```tsx
        onRewardRedeem={onRewardRedeem}
        onRewardClose={onRewardClose}
        onSubmitConfirm={onSubmitConfirm}
        onClaimed={onClaimed}
        go={go}
      />
    </div>
  );
```

The new line is `onClaimed={onClaimed}`. It goes between `onSubmitConfirm={onSubmitConfirm}` and `go={go}`.

The `const onClaimed = (...) => { ... };` function from Part A goes above this `return (`, not inside the JSX. Your screenshot showed the spot, which was right after the `};` of `onSubmitConfirm`. If you haven't added it yet, add both pieces now. If the function is missing, you'll get a new error saying `onClaimed` is not defined.

Save the file, and the red error should disappear.

# Human — Nov 20, 2026, 8:48 PM

like this?   const onClaimed = (r: { newBalance: number; pointsAwarded: number; bottles: number }) => {
    patchAuthBalance(r.newBalance);
    setProfileUser((prev: any) => ({
      ...(prev || currentUser),
      points: r.newBalance,
      pointsBalance: r.newBalance,
      submissions: Number(currentUser.submissions || 0) + 1,
    }));
  };

# Claude — Nov 20, 2026, 8:48 PM

Yes, that function is correct. Two things to check:

1. **Position.** It must sit inside `App()`, above the final `return (`, after the `onSubmitConfirm` function. It should read like this:

```tsx
  const onSubmitConfirm = () => {
    ...
    go("submit-done");
  };

  const onClaimed = (r: { newBalance: number; pointsAwarded: number; bottles: number }) => {
    ...
  };

  return (
    <div
```

2. **The prop line.** The function alone isn't enough. `onClaimed={onClaimed}` must also be inside `<MobileScreens ... />`, between `onSubmitConfirm={onSubmitConfirm}` and `go={go}`.

Save the file. The Problems panel should then show no errors. If you still see one, send a screenshot of it.

Then test it:

1. Send the test deposit to your local server from PowerShell:
   ```powershell
   $body = @{ transaction_id="test-0002"; machine_id="K-01"; bottles=3; points=15; code="TEST2345" } | ConvertTo-Json
   Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/machine/transactions" -Headers @{ "X-Machine-Key"="test-key-123" } -ContentType "application/json" -Body $body
   ```
   I used `test-0002` because `test-0001` and `TEST2345` may already exist from your earlier tests. If you get `duplicate`, or an error that the code is already used, change both to new values, for example `test-0003` and `TEST6789`. The code must be exactly 8 letters or digits.
2. Open the app, log in as a resident, tap **Redeem Receipt Code** on Home, enter the code and press **Redeem Points**. You should see "+15 pts" and the new balance.

# Human — Nov 20, 2026, 8:49 PM

> **Attachment: attachment · txt · 174.0 KB**
>
> import { useState, useEffect, useRef, useMemo } from "react";
> import { Waste2GoodsAPI, getApiHost, setApiHost as persistApiHost, getApiBaseUrl, testApiConnection, isServerIpPanelEnabled } from "@waste2goods/core";
> import { Html5QrcodeScanner } from "html5-qrcode";
> import {
>   Monitor, Recycle, Home, QrCode, Gift,
>   Target, User, ArrowLeft, AlertCircle, CheckCircle2,
>   RefreshCw, MapPin,
>   Trophy, Medal, Zap,
>   Bell, LogOut,
>   ChevronRight, Shield, Mail, Phone, Leaf,
>   Settings, Lock, Info, Flame, Camera, Globe,
>   ScanLine, Keyboard, Hash, Sparkles, Award, Upload, CheckSquare2, Cable, Wallet, X, Circle, Package,
>   Copy, Check
> } from "lucide-react";
> import ScreenRedeemCode from "./ScreenRedeemCode";
> 
> type MobileScreen =
>   | "splash" | "onboard1" | "onboard2" | "onboard3"
>   | "login" | "register" | "mfa" | "profile-setup"
>   | "home" | "submit" | "submit-scan" | "submit-confirm" | "submit-done"
>   | "rewards" | "redeem-confirm" | "redeem-history"
>   | "tasks" | "profile" | "history" | "settings" | "notifications"
>   | "leaderboard" | "redeem-code";
> 
> // Default LAN address of the local development backend (offline demo fallback only).
> // This is a private RFC-1918 address (192.168.0.0/16) used as a convenience default for
> // instructor/demo setups on a local network — it is never a production endpoint.
> const DEFAULT_DEV_API_HOST = "192.168.1.164"; // NOSONAR - intentional private-range dev/demo default (typescript:S1313)
> 
> const weeklyData = [
>   { day: "Mon", kg: 42 }, { day: "Tue", kg: 67 }, { day: "Wed", kg: 53 },
>   { day: "Thu", kg: 89 }, { day: "Fri", kg: 74 }, { day: "Sat", kg: 112 }, { day: "Sun", kg: 95 }
> ];
> const monthlyData = [
>   { month: "Jan", collected: 820, users: 210, redeemed: 65 },
>   { month: "Feb", collected: 940, users: 245, redeemed: 80 },
>   { month: "Mar", collected: 1100, users: 290, redeemed: 102 },
>   { month: "Apr", collected: 980, users: 275, redeemed: 89 },
>   { month: "May", collected: 1340, users: 340, redeemed: 134 },
>   { month: "Jun", collected: 1450, users: 380, redeemed: 158 }
> ];
> const wasteTypes = [
>   { name: "PET Plastic", value: 38, color: "#16a34a" },
> ];
> const DEMO_LEADERBOARD_FALLBACK = [
>   { rank: 1, name: "Ana Reyes", barangay: "Cabantian", points: 4820, avatar: "AR", streak: 14 },
>   { rank: 2, name: "Carlo Mendoza", barangay: "Cabantian", points: 3950, avatar: "CM", streak: 9 },
>   { rank: 3, name: "Maria Santos", barangay: "Cabantian", points: 2840, avatar: "MS", streak: 7 },
>   { rank: 4, name: "Jose Dela Cruz", barangay: "Cabantian", points: 2310, avatar: "JD", streak: 5 },
>   { rank: 5, name: "Liza Villareal", barangay: "Cabantian", points: 1990, avatar: "LV", streak: 3 },
>   { rank: 6, name: "Ben Pascual", barangay: "Cabantian", points: 1640, avatar: "BP", streak: 2 },
> ];
> const rewards = [
>   { id: 1, name: "School Supplies Kit", points: 500, cost: 500, category: "Education", stock: 23, icon: "📚", seasonal: false, description: "Complete school essentials set including notebooks, pens, and bag.", delivery: "Barangay Pick-up", validity: "30 Days" },
>   { id: 2, name: "Grocery Voucher ₱100", points: 800, cost: 800, category: "Grocery", stock: 15, icon: "🛒", seasonal: false, description: "₱100 voucher redeemable at all participating local grocery stores.", delivery: "Digital Code", validity: "60 Days" },
>   { id: 3, name: "Eco Water Bottle", points: 350, cost: 350, category: "Lifestyle", stock: 41, icon: "🍶", seasonal: false, description: "BPA-free stainless steel insulated 750ml eco water bottle.", delivery: "Barangay Pick-up", validity: "30 Days" },
>   { id: 4, name: "Rice (5kg)", points: 1200, cost: 1200, category: "Grocery", stock: 8, icon: "🌾", seasonal: false, description: "5kg premium white rice bag for family consumption.", delivery: "Kiosk Pickup", validity: "14 Days" },
>   { id: 5, name: "Plant Seedling Set", points: 250, cost: 250, category: "Garden", stock: 60, icon: "🌱", seasonal: true, description: "Assorted vegetable seedlings set for home gardening.", delivery: "Barangay Pick-up", validity: "14 Days" },
>   { id: 6, name: "Reusable Bag Bundle", points: 180, cost: 180, category: "Lifestyle", stock: 88, icon: "👜", seasonal: false, description: "3x heavy-duty canvas reusable shopping bags.", delivery: "Barangay Pick-up", validity: "60 Days" },
>   { id: 7, name: "Back-to-School Bundle", points: 650, cost: 650, category: "Education", stock: 12, icon: "🎒", seasonal: true, description: "Backpack, water flask, and basic stationery kit.", delivery: "Barangay Pick-up", validity: "30 Days" },
>   { id: 8, name: "Herbal Tea Set", points: 300, cost: 300, category: "Wellness", stock: 35, icon: "🍵", seasonal: true, description: "Organic herbal tea selection with bamboo strainer.", delivery: "Barangay Pick-up", validity: "30 Days" },
> ];
> const tasks = [
>   { id: 1, title: "Submit 2kg of PET bottles", reward: 100, progress: 1.4, goal: 2, unit: "kg", type: "daily", done: false },
>   { id: 2, title: "Visit kiosk 3 days in a row", reward: 150, progress: 2, goal: 3, unit: "days", type: "weekly", done: false },
>   { id: 3, title: "Refer a neighbor", reward: 200, progress: 1, goal: 1, unit: "person", type: "special", done: true },
>   { id: 4, title: "Collect 5kg of cardboard", reward: 120, progress: 5, goal: 5, unit: "kg", type: "weekly", done: true },
>   { id: 5, title: "Submit any 3 material types", reward: 80, progress: 2, goal: 3, unit: "types", type: "daily", done: false },
> ];
> const transactions = [
>   { id: "T-0041", date: "Jun 17, 2026", type: "earn", desc: "PET Plastic · 2.3 kg · K-01", pts: 115 },
>   { id: "T-0040", date: "Jun 16, 2026", type: "earn", desc: "Cardboard · 3.1 kg · K-02", pts: 93 },
>   { id: "T-0039", date: "Jun 15, 2026", type: "redeem", desc: "Eco Water Bottle", pts: -350 },
>   { id: "T-0038", date: "Jun 14, 2026", type: "earn", desc: "Metal Cans · 1.8 kg · K-01", pts: 144 },
>   { id: "T-0037", date: "Jun 13, 2026", type: "bonus", desc: "Weekly Challenge Complete", pts: 150 },
>   { id: "T-0036", date: "Jun 12, 2026", type: "earn", desc: "Glass Bottles · 2.0 kg · K-04", pts: 50 },
> ];
> const kiosks = [
>   { id: "K-01", location: "Cabantian Hall", status: "online", weight: "2.3 kg", submissions: 12, battery: 94, lastPing: "2 min ago", temp: "28°C" },
>   { id: "K-02", location: "Cabantian Elementary School", status: "online", weight: "0.8 kg", submissions: 7, battery: 78, lastPing: "1 min ago", temp: "27°C" },
>   { id: "K-03", location: "Cabantian Market", status: "offline", weight: "—", submissions: 0, battery: 0, lastPing: "3 hrs ago", temp: "—" },
>   { id: "K-04", location: "Cabantian Covered Court", status: "online", weight: "4.1 kg", submissions: 19, battery: 61, lastPing: "just now", temp: "30°C" },
>   { id: "K-05", location: "Cabantian Gym", status: "maintenance", weight: "—", submissions: 0, battery: 45, lastPing: "45 min ago", temp: "—" },
> ];
> 
> const STYLE_WEEKLY_DATA = [
>   { day: "Mon", kg: 42 }, { day: "Tue", kg: 67 }, { day: "Wed", kg: 53 },
>   { day: "Thu", kg: 89 }, { day: "Fri", kg: 74 }, { day: "Sat", kg: 112 }, { day: "Sun", kg: 95 }
> ];
> const BADGE_SUCCESS_CLS = "bg-green-100 text-green-700";
> const BADGE_WARN_CLS = "bg-amber-100 text-amber-700";
> const BADGE_DANGER_BG = "bg-red-50 border border-red-200 text-red-700";
> const BADGE_OK_BG = "bg-green-50 border border-green-200 text-green-700";
> const INPUT_BASE_CLS = "w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
> const BTN_PRIMARY_CLS = "rounded-2xl bg-primary text-white font-black hover:bg-green-700 transition-colors";
> const BTN_SECONDARY_CLS = "rounded-2xl border border-border font-bold text-foreground hover:bg-secondary transition-colors";
> 
> function RankIcon({ rank }: Readonly<{ rank: number }>) {
>   if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
>   if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
>   if (rank === 3) return <Medal className="w-5 h-5 text-amber-500" />;
>   return <span className="text-xs text-muted-foreground font-mono font-bold">#{rank}</span>;
> }
> 
> function StatusPip({ status }: Readonly<{ status: string }>) {
>   const c: Record<string, string> = { online: "bg-emerald-400", offline: "bg-red-400", maintenance: "bg-amber-400", active: "bg-emerald-400", inactive: "bg-gray-300" };
>   return <span className={`inline-block w-3 h-3 rounded-full ${c[status] ?? "bg-gray-300"}`} />;
> }
> 
> function SignalIcon({ className }: Readonly<{ className?: string }>) {
>   return (
>     <svg className={className} viewBox="0 0 16 16" fill="currentColor">
>       <rect x="0" y="9" width="3" height="7" rx="1" /><rect x="4.5" y="6" width="3" height="10" rx="1" />
>       <rect x="9" y="3" width="3" height="13" rx="1" /><rect x="13.5" y="0" width="3" height="16" rx="1" />
>     </svg>
>   );
> }
> 
> function AnimatedNumber({ value, suffix = "", className = "" }: Readonly<{ value: number; suffix?: string; className?: string }>) {
>   return <span className={className}>{value}{suffix}</span>;
> }
> 
> function elapsedFromTs(ts?: number | string | null): string {
>   if (!ts) return "";
>   const diffSec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
>   if (diffSec < 60) return `${diffSec}s ago`;
>   const diffMin = Math.floor(diffSec / 60);
>   if (diffMin < 60) return `${diffMin}m ago`;
>   return `${Math.floor(diffMin / 60)}h ago`;
> }
> 
> function useAnimatedWeight(target: number, running: boolean) {
>   const [val, setVal] = useState(0);
>   useEffect(() => {
>     if (!running) return;
>     const step = target / 40;
>     let cur = 0;
>     const iv = setInterval(() => {
>       cur = Math.min(cur + step, target);
>       setVal(Number.parseFloat(cur.toFixed(2)));
>       if (cur >= target) clearInterval(iv);
>     }, 60);
>     return () => clearInterval(iv);
>   }, [running, target]);
>   return val;
> }
> 
> function Field({
>   label,
>   placeholder,
>   type = "text",
>   icon,
>   value,
>   onChange,
>   defaultValue,
>   defaultVal,
>   containerClassName,
>   inputClassName,
>   id,
> }: Readonly<{
>   label: string;
>   placeholder: string;
>   type?: string;
>   icon?: React.ReactNode;
>   value?: string;
>   onChange?: (value: string) => void;
>   defaultValue?: string;
>   defaultVal?: string;
>   containerClassName?: string;
>   inputClassName?: string;
>   id?: string;
> }>) {
>   const initialValue = value ?? defaultValue ?? defaultVal;
>   const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);
>   return (
>     <div className={containerClassName}>
>       {label ? <label htmlFor={inputId} className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label> : null}
>       <div className="relative">
>         {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</div>}
>         <input
>           id={inputId}
>           type={type}
>           value={initialValue}
>           onChange={(e) => onChange?.(e.target.value)}
>           placeholder={placeholder}
>           className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${inputClassName ?? ""}`}
>         />
>       </div>
>     </div>
>   );
> }
> 
> function SelectField({
>   label,
>   placeholder,
>   icon,
>   value,
>   options,
>   onChange,
>   disabled,
> }: Readonly<{
>   label: string;
>   placeholder: string;
>   icon?: React.ReactNode;
>   value: string;
>   options: string[];
>   onChange: (value: string) => void;
>   disabled?: boolean;
> }>) {
>   return (
>     <div>
>       <label className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">{label}</label>
>       <div className="relative">
>         {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">{icon}</div>}
>         <select
>           value={value}
>           disabled={disabled}
>           onChange={(e) => onChange(e.target.value)}
>           className={`w-full ${icon ? "pl-10" : "pl-4"} pr-10 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed`}
>         >
>           <option value="">{placeholder}</option>
>           {options.map((opt) => (
>             <option key={opt} value={opt}>
>               {opt}
>             </option>
>           ))}
>         </select>
>         <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-muted-foreground pointer-events-none" />
>       </div>
>     </div>
>   );
> }
> 
> // ── Functional Redemption (REAL DB writes via POST /api/rewards/redeem) ──
> 
> function patchAuthBalance(newBalance: number) {
>   const AUTH_STORAGE_KEY = "w2g_auth_state";
>   try {
>     const auth = Waste2GoodsAPI.getAuthState();
>     if (auth?.user) {
>       const patchedUser = { ...auth.user, points: Number(newBalance), pointsBalance: Number(newBalance) };
>       const patchedAuth = { ...auth, user: patchedUser, isAuthenticated: true };
>       try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(patchedAuth)); } catch { }
>     }
>   } catch { }
> }
> 
> function getRedeemButtonLabel(loading: boolean, success: any): string {
>   if (loading) return "Processing...";
>   if (success) return "✅ Done — back to Rewards Catalog";
>   return "Confirm Redemption";
> }
> 
> 
> 
> function saveServerIp(apiHost: string, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): string | null {
>   const trimmed = apiHost.trim();
>   if (!trimmed) {
>     onSaved?.({ type: "err", text: "Please enter an IP address or hostname" });
>     return null;
>   }
>   persistApiHost(trimmed);
>   const cleanHost = getApiHost();
>   const url = getApiBaseUrl().replace(/\/api$/, "");
>   onSaved?.({ type: "ok", text: `✅ Server saved: ${url} — setting saved on device.` });
>   return cleanHost;
> }
> 
> function getBackendOrigin(): string {
>   try {
>     const base = getApiBaseUrl();
>     if (base === "/api" || base.startsWith("/")) {
>       return typeof window !== "undefined" && window.location
>         ? window.location.origin
>         : "http://localhost:3001";
>     }
>     if (base.startsWith("http://") || base.startsWith("https://")) {
>       return base.replace(/\/api\/?$/, "");
>     }
>     return "http://localhost:3001";
>   } catch {
>     return "http://localhost:3001";
>   }
> }
> 
> async function testServerIp(apiHost: string, setTesting: (v: boolean) => void, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): Promise<void> {
>   const trimmed = apiHost.trim();
>   if (!trimmed) {
>     onSaved?.({ type: "err", text: "Please enter an IP address first" });
>     return;
>   }
>   setTesting(true);
>   persistApiHost(trimmed);
>   const result = await testApiConnection();
>   onSaved?.({ type: result.ok ? "ok" : "err", text: result.message });
>   setTesting(false);
> }
> 
> function resetServerIp(setApiHost: (v: string) => void, onSaved?: (msg: { type: "ok" | "err"; text: string }) => void): void {
>   setApiHost(DEFAULT_DEV_API_HOST);
>   persistApiHost(DEFAULT_DEV_API_HOST);
>   onSaved?.({ type: "ok", text: `Default set to ${DEFAULT_DEV_API_HOST}:3001` });
> }
> 
> function ServerIpPanel({
>   apiHost,
>   setApiHost,
>   onSaved,
>   compact,
> }: Readonly<{
>   apiHost: string;
>   setApiHost: (v: string) => void;
>   onSaved?: (msg: { type: "ok" | "err"; text: string }) => void;
>   compact?: boolean;
> }>) {
>   // Production (waste2goods.site): the API is same-origin — never show the
>   // LAN-IP panel. Local dev (localhost / LAN IP) keeps it for Wi-Fi testing.
>   if (!isServerIpPanelEnabled()) return null;
>   const [testing, setTesting] = useState(false);
>   const save = () => {
>     saveServerIp(apiHost, onSaved);
>   };
>   const test = async () => {
>     await testServerIp(apiHost, setTesting, onSaved);
>   };
>   const resetToDefault = () => {
>     resetServerIp(setApiHost, onSaved);
>   };
>   return (
>     <div className={`rounded-2xl bg-blue-50 border border-blue-200 space-y-2.5 ${compact ? "p-2.5" : "p-4"}`}>
>       <div className="flex items-start gap-2">
>         <Globe className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
>         <div className="flex-1 min-w-0">
>           <p className="text-xs font-black text-blue-800 uppercase tracking-wide">Backend Server IP</p>
>           <p className="text-[11px] text-blue-700 leading-snug">
>             Enter your PC's <strong>LAN IP</strong>. Saved on device — no rebuild after Wi‑Fi changes.
>           </p>
>         </div>
>       </div>
>       <div>
>         <label htmlFor="server-ip-addr-input" className="text-[11px] font-black text-muted-foreground uppercase tracking-wide mb-1 block">PC IP Address</label>
>         <input
>           id="server-ip-addr-input"
>           type="text"
>           value={apiHost}
>           onChange={e => setApiHost(e.target.value)}
>           placeholder="e.g. 192.168.1.100 or localhost"
>           autoCapitalize="none"
>           autoCorrect="off"
>           spellCheck={false}
>           className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
>         />
>         <div className="flex items-center justify-between mt-1 gap-2">
>           <p className="text-[10px] text-blue-600 font-mono truncate min-w-0">→ {getApiBaseUrl()}</p>
>           <button
>             type="button"
>             onClick={resetToDefault}
>             className="text-[10px] font-bold text-blue-700 hover:underline flex-shrink-0 whitespace-nowrap"
>           >
>             Reset to localhost
>           </button>
>         </div>
>       </div>
>       <div className="flex gap-2">
>         <button
>           type="button"
>           onClick={save}
>           className={`flex-1 ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} rounded-xl bg-primary text-white font-black hover:bg-green-700 transition-colors`}
>         >
>           💾 Save IP
>         </button>
>         <button
>           type="button"
>           onClick={test}
>           disabled={testing}
>           className={`flex-1 ${compact ? "py-2.5 text-xs" : "py-3 text-sm"} rounded-xl border border-blue-300 bg-white text-blue-800 font-black disabled:opacity-60 hover:bg-blue-50 transition-colors`}
>         >
>           {testing ? (
>             <span className="inline-flex items-center justify-center gap-1.5">
>               <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing…
>             </span>
>           ) : "🔌 Test"}
>         </button>
>       </div>
>       {!compact && (
>         <div className="rounded-xl bg-white/60 border border-blue-100 p-2.5 text-[11px] text-blue-800 leading-snug space-y-1">
>           <p><strong>💡 Tip:</strong> To find your PC's LAN IP:</p>
>           <ul className="list-disc list-inside space-y-0.5 pl-1">
>             <li>Windows: Open CMD → type <span className="font-mono">ipconfig</span> → look for <strong>IPv4 Address</strong></li>
>             <li>Mac/Linux: Terminal → type <span className="font-mono">ifconfig</span> or <span className="font-mono">ip a</span></li>
>           </ul>
>         </div>
>       )}
>     </div>
>   );
> }
> 
> function renderKioskBadgeBody(checking?: boolean, connected?: boolean, kioskId?: string, elapsedLabel?: string) {
>   if (checking && !connected) {
>     return <span className="truncate">Checking kiosk link…</span>;
>   }
>   if (connected) {
>     return (
>       <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
>         <span>Kiosk linked · <strong className="truncate">{kioskId || "K-01"}</strong></span>
>         {elapsedLabel && (
>           <>
>             <span className="text-green-600/70 font-normal">·</span>
>             <span className="text-[10px] font-semibold text-green-700/80">{elapsedLabel} elapsed</span>
>           </>
>         )}
>         <span className="block w-full text-[10px] font-semibold text-green-700/80 -mt-0.5">
>           You can submit PET plastic at this kiosk
>         </span>
>       </div>
>     );
>   }
>   return <span className="truncate">No kiosk linked — scan the kiosk QR via Submit tab</span>;
> }
> 
> function KioskLinkBadge({
>   connected,
>   kioskId,
>   checking,
>   connectedAt,
>   onDisconnect,
> }: Readonly<{
>   connected: boolean;
>   kioskId?: string;
>   checking?: boolean;
>   connectedAt?: number;
>   onDisconnect?: () => void;
> }>) {
>   const elapsed = connectedAt ? Math.floor((Date.now() - connectedAt) / 1000) : 0;
>   const elapsedLabel = (() => {
>     if (!connectedAt) return "";
>     if (elapsed < 60) return `${elapsed}s`;
>     if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
>     return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
>   })();
>   return (
>     <div
>       className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-2 border text-xs font-bold ${connected ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-border text-muted-foreground"
>         }`}
>     >
>       <Monitor className={`w-4 h-4 flex-shrink-0 ${connected ? "text-green-600" : ""}`} />
>       <div className="flex-1 min-w-0">
>         {renderKioskBadgeBody(checking, connected, kioskId, elapsedLabel)}
>       </div>
>       {checking && <RefreshCw className="w-3 h-3 ml-auto animate-spin flex-shrink-0 opacity-60" />}
>       {connected && !checking && (
>         <>
>           <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Connected" />
>           {onDisconnect && (
>             <button
>               type="button"
>               onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
>               className="ml-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-300 bg-white/60 text-green-800 hover:bg-green-100 transition-colors flex-shrink-0"
>             >
>               Disconnect
>             </button>
>           )}
>         </>
>       )}
>     </div>
>   );
> }
> 
> type MobileUserShape = {
>   id: string; userId: string; name: string; initials: string; email: string; phone: string;
>   barangay: string; barangayName: string; province: string; city: string; streetAddress: string;
>   points: number; submissions: number; redeemed: number; joined: string; createdAt: any;
>   firstName: string; lastName: string; totalKg: number;
> };
> 
> function initialsFromName(name: string, fallback: string) {
>   return (name || fallback)
>     .split(/\s+/)
>     .filter(Boolean)
>     .map((p: string) => p[0])
>     .join("")
>     .toUpperCase()
>     .slice(0, 2);
> }
> 
> function buildCurrentUser(profileUser: any): MobileUserShape {
>   const userObj = profileUser || Waste2GoodsAPI.getAuthState()?.user || null;
>   if (userObj) {
>     const rawName = (userObj.name || `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim()) as string;
>     const fallbackFromFlds = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim();
>     const id = (userObj as any).id || (userObj as any).userId || "";
>     const name = rawName || fallbackFromFlds || (id ? "" : "Guest User");
>     const init = initialsFromName(name || `${userObj.firstName || ""} ${userObj.lastName || ""}`, id ? "U" : "GU");
>     const points = (userObj as any).points ?? (userObj as any).pointsBalance ?? 0;
>     return {
>       id,
>       userId: id,
>       name,
>       initials: init || (id ? "U" : "GU"),
>       email: (userObj as any).email || "",
>       phone: (userObj as any).phone || "",
>       barangay: (userObj as any).barangay || (userObj as any).barangayName || "Cabantian",
>       barangayName: (userObj as any).barangayName || (userObj as any).barangay || "",
>       province: (userObj as any).province || "",
>       city: (userObj as any).city || "",
>       streetAddress: (userObj as any).streetAddress || "",
>       points: Number(points) || 0,
>       submissions: Number((userObj as any).submissions ?? (userObj as any).totalSubmissions ?? 0) || 0,
>       redeemed: Number((userObj as any).redeemed || 0),
>       joined: (userObj as any).joined || "",
>       createdAt: (userObj as any).createdAt || null,
>       firstName: (userObj as any).firstName || "",
>       lastName: (userObj as any).lastName || "",
>       totalKg: Number((userObj as any).totalKg || 0),
>     };
>   }
>   return {
>     id: "", userId: "", name: "", initials: "", email: "", phone: "",
>     barangay: "Cabantian", barangayName: "Cabantian", province: "Davao del Sur", city: "Davao City",
>     streetAddress: "", points: 0, submissions: 0, redeemed: 0, joined: "", createdAt: null,
>     firstName: "", lastName: "", totalKg: 0,
>   };
> }
> 
> function currentUserIdForLeaderboard() {
>   try {
>     const auth = Waste2GoodsAPI.getAuthState()?.user || null;
>     const u = buildCurrentUser(auth);
>     return String(auth?.id || auth?.userId || u.id || u.userId || "").toUpperCase();
>   } catch {
>     return "";
>   }
> }
> 
> function buildMergedLeaderboard(liveLeaderboard: any[] | null, currentUser: MobileUserShape) {
>   const myId = currentUserIdForLeaderboard() || String(currentUser.id || currentUser.userId || "").toUpperCase();
>   const myEmail = String(currentUser.email || "").toLowerCase();
>   const myName = currentUser.name || "You";
> 
>   let list = (liveLeaderboard && liveLeaderboard.length > 0)
>     ? liveLeaderboard.map((u: any, i: number) => {
>       const firstName = u.firstName || "";
>       const lastName = u.lastName || "";
>       const name = (u.name && u.name.trim() !== "") ? u.name : [firstName, lastName].filter(Boolean).join(" ").trim() || u.userId || "Resident";
>       const pts = Number(u.points ?? u.pointsBalance ?? 0);
>       const subs = Number(u.submissions ?? u.totalSubmissions ?? 0);
>       const uid = String(u.userId ?? u.id ?? "").toUpperCase();
>       const uEmail = String(u.email || "").toLowerCase();
>       const isMe = (!!myId && !!uid && uid === myId) || (!!myEmail && !!uEmail && uEmail === myEmail) || (name.toLowerCase() === myName.toLowerCase());
>       const avatarChars = initialsFromName(name, "RU");
>       return {
>         id: uid || `u-${i}`,
>         userId: uid,
>         name,
>         displayName: name,
>         _initials: avatarChars || "RU",
>         avatar: avatarChars || "RU",
>         barangay: u.barangay || u.barangayName || currentUser.barangay || "Cabantian",
>         points: pts,
>         submissions: subs,
>         totalKg: Number(u.totalKg || (subs * 2.3)),
>         streak: Number(u.streak) || (subs > 0 ? Math.min(30, Math.max(1, Math.ceil(subs / 2))) : 1),
>         isMe,
>         _isYou: isMe,
>       };
>     })
>     : DEMO_LEADERBOARD_FALLBACK.map((u: any, i: number) => {
>       const isMe = (u.name.toLowerCase() === myName.toLowerCase()) || (Boolean(u.id) && u.id === currentUser.id);
>       const demoId = u.id || `demo-${u.rank || i + 1}`;
>       return {
>         id: demoId,
>         userId: demoId,
>         name: u.name,
>         displayName: u.name,
>         _initials: u.avatar || "RU",
>         avatar: u.avatar || "RU",
>         barangay: u.barangay || "Cabantian",
>         points: u.points,
>         submissions: 10,
>         totalKg: 23.0,
>         streak: u.streak || 5,
>         isMe,
>         _isYou: isMe,
>       };
>     });
> 
>   // Ensure logged-in user is present in leaderboard
>   const hasMe = list.some(u => u.isMe);
>   if (!hasMe && currentUser.name && currentUser.name !== "Guest User") {
>     const userInitials = currentUser.initials || initialsFromName(currentUser.name, "RU");
>     list.push({
>       id: currentUser.id || "my-user",
>       userId: currentUser.id || "my-user",
>       name: currentUser.name,
>       displayName: currentUser.name,
>       _initials: userInitials,
>       avatar: userInitials,
>       barangay: currentUser.barangay || "Cabantian",
>       points: Number(currentUser.points || 0),
>       submissions: Number(currentUser.submissions || 0),
>       totalKg: Number(currentUser.totalKg || 0),
>       streak: 7,
>       isMe: true,
>       _isYou: true,
>     });
>   }
> 
>   // Sort by points descending and calculate ranks
>   list.sort((a, b) => b.points - a.points);
>   return list.map((u, idx) => ({ ...u, rank: idx + 1 }));
> }
> 
> function MobileBottomNav({ screen, go }: Readonly<{ screen: MobileScreen; go: (s: MobileScreen) => void }>) {
>   const items = [
>     { icon: <Home className="w-5 h-5" />, label: "Home", s: "home" as MobileScreen },
>     { icon: <QrCode className="w-5 h-5" />, label: "Submit", s: "submit" as MobileScreen },
>     { icon: <Gift className="w-5 h-5" />, label: "Rewards", s: "rewards" as MobileScreen },
>     { icon: <Target className="w-5 h-5" />, label: "Tasks", s: "tasks" as MobileScreen },
>     { icon: <User className="w-5 h-5" />, label: "Profile", s: "profile" as MobileScreen },
>   ];
>   return (
>     <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-3 pt-3 flex justify-around z-20" style={{ paddingBottom: "calc(0.75rem + var(--sab))" }}>
>       {items.map(i => (
>         <button type="button" key={i.label} onClick={() => go(i.s)} className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors ${screen === i.s || (i.s === "submit" && ["submit", "submit-scan", "submit-confirm", "submit-done"].includes(screen)) ? "text-primary" : "text-muted-foreground"}`}>
>           {i.icon}
>           <span className="text-xs font-bold">{i.label}</span>
>         </button>
>       ))}
>     </div>
>   );
> }
> 
> // Philippine Location Data: Province → Cities → Barangays (sample subset with Cabantian, Davao)
> const PH_LOCATIONS: Record<string, Record<string, string[]>> = {
>   "Davao del Sur": {
>     "Davao City": ["Cabantian", "Buhangin", "Poblacion", "Matina", "Toril", "Tugbok", "Calinan", "Marilog", "Baguio", "Paquibato"],
>     "Digos City": ["Barangay 1 Pob.", "Barangay 2 Pob.", "San Jose", "San Miguel", "Aplaya"],
>     "Sta. Cruz": ["Poblacion", "Sibulan", "Darong", "Inauayan", "Bato"],
>   },
>   "Metro Manila": {
>     "Quezon City": ["Diliman", "Loyola Heights", "Project 4", "Kamuning", "Commonwealth", "Batasan Hills"],
>     "Manila": ["Sampaloc", "Ermita", "Malate", "Quiapo", "Tondo", "Pasay"],
>     "Makati City": ["Poblacion", "Bel-Air", "San Lorenzo", "Urdaneta", "Forbes Park"],
>     "Taguig City": ["BGC", "Upper Bicutan", "Lower Bicutan", "Hagonoy", "Tuktukan"],
>   },
>   "Cebu": {
>     "Cebu City": ["Lahug", "Cebu Business Park", "Mabolo", "Talamban", "Poblacion Pardo", "San Nicolas"],
>     "Mandaue City": ["Centro", "Canduman", "Maguikay", "Opao", "Tabok"],
>     "Lapu-Lapu City": ["Punta Engaño", "Lapu-Lapu Pob.", "Marigondon", "Mactan"],
>   },
>   "Bukidnon": {
>     "Valencia City": ["Poblacion", "Bagontaas", "Lumbayao", "Batangan", "Guinoyuran"],
>     "Malaybalay City": ["Poblacion", "Sumpong", "Pal-ing", "Linabo", "Casisang"],
>   },
>   "Misamis Oriental": {
>     "Cagayan de Oro": ["Pueblo de Oro", "Liceo", "Divisoria", "Carmen", "Macasandig", "Bulua"],
>   },
>   "South Cotabato": {
>     "General Santos": ["Poblacion", "San Jose", "Calumpang", "Bula", "Conel", "Fatima"],
>   },
>   "Davao de Oro": {
>     "Compostela": ["Poblacion", "San Jose", "Moncado", "Maparat", "Ngan"],
>   },
>   "Davao Oriental": {
>     "Mati City": ["Dahican", "Poblacion", "Sainz", "Macambol", "Badas"],
>   },
>   "Davao del Norte": {
>     "Panabo City": ["Poblacion", "Kasilak", "San Francisco", "Quezon", "Cacao"],
>     "Tagum City": ["Poblacion", "Madaum", "San Agustin", "Apokon", "Liboganon"],
>   },
> };
> 
> const ALPHABETICAL_COLLATOR = new Intl.Collator("en", {
>   sensitivity: "base",
>   caseFirst: "false",
>   numeric: true,
> });
> const alphabeticalCompare = (a: string, b: string) => ALPHABETICAL_COLLATOR.compare(a, b);
> const PROVINCES = Object.keys(PH_LOCATIONS).sort(alphabeticalCompare);
> 
> const UNPROTECTED_SCREENS = new Set<MobileScreen>([
>   "splash", "onboard1", "onboard2", "onboard3",
>   "login", "register", "mfa", "profile-setup",
> ]);
> 
> function isAuthRequiredScreen(screen: MobileScreen) {
>   return !UNPROTECTED_SCREENS.has(screen);
> }
> 
> function isSessionValid() {
>   const auth = Waste2GoodsAPI.getAuthState();
>   return Boolean(auth?.isAuthenticated && auth?.token);
> }
> 
> function formatNotifTimeAgo(t: string) {
>   try {
>     const ms = new Date(t).getTime();
>     if (!ms) return "";
>     const diff = Date.now() - ms;
>     const mins = Math.floor(diff / 60000);
>     if (mins < 1) return "Just now";
>     if (mins < 60) return `${mins}m ago`;
>     const hrs = Math.floor(mins / 60);
>     if (hrs < 24) return `${hrs}h ago`;
>     const days = Math.floor(hrs / 24);
>     if (days < 7) return `${days}d ago`;
>     return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
>   } catch {
>     return "";
>   }
> }
> 
> function notifIconForType(type: string, severity: string) {
>   if (type === "redemption") return <Gift className={`w-4 h-4 ${severity === "danger" ? "text-red-600" : "text-indigo-600"}`} />;
>   if (type === "milestone") return <Trophy className="w-4 h-4 text-amber-600" />;
>   if (type === "task") return <Target className="w-4 h-4 text-primary" />;
>   if (type === "welcome") return <Leaf className="w-4 h-4 text-green-600" />;
>   if (type === "submission") return <Recycle className="w-4 h-4 text-green-700" />;
>   return <Bell className="w-4 h-4 text-muted-foreground" />;
> }
> 
> function notifIconBgClass(type: string) {
>   if (type === "redemption") return "bg-indigo-100";
>   if (type === "milestone") return "bg-amber-100";
>   if (type === "task") return "bg-green-100";
>   if (type === "welcome") return "bg-emerald-100";
>   if (type === "submission") return "bg-lime-100";
>   return "bg-slate-100";
> }
> 
> 
> 
> type RegFormFields = {
>   regFullName: string;
>   regEmail: string;
>   regPassword: string;
>   regConfirmPassword: string;
>   regProvince: string;
>   regCity: string;
>   regBarangay: string;
> };
> 
> function validateRegStep0(fields: RegFormFields): string | null {
>   if (!fields.regFullName || !fields.regEmail || !fields.regPassword || !fields.regConfirmPassword) {
>     return "Please fill in all fields: name, email, phone, password, confirm password";
>   }
>   if (fields.regPassword !== fields.regConfirmPassword) return "Passwords do not match";
>   if (fields.regPassword.length < 6) return "Password must be at least 6 characters";
>   return null;
> }
> 
> function validateRegStep1(fields: Pick<RegFormFields, "regProvince" | "regCity" | "regBarangay">): string | null {
>   if (!fields.regProvince || !fields.regCity || !fields.regBarangay) {
>     return "Please select Province, City/Municipality, and Barangay";
>   }
>   return null;
> }
> 
> function validateRegComplete(fields: RegFormFields): { error: string | null; step?: number } {
>   const step0 = validateRegStep0(fields);
>   if (step0) return { error: step0, step: 0 };
>   const step1 = validateRegStep1(fields);
>   if (step1) return { error: step1, step: 1 };
>   return { error: null };
> }
> 
> function parseRegName(fullName: string) {
>   const names = fullName.trim().split(/\s+/);
>   return { firstName: names[0] || "User", lastName: names.slice(1).join(" ") || "Lastname" };
> }
> 
> function buildProfilePatches(fields: {
>   setFName: string; setLName: string; setFormEmail: string; setPhone: string;
>   setProvince: string; setCity: string; setBrgy: string;
> }) {
>   const patches: Record<string, string> = {};
>   if (fields.setFName) patches.firstName = fields.setFName;
>   if (fields.setLName) patches.lastName = fields.setLName;
>   if (fields.setFormEmail) patches.email = fields.setFormEmail;
>   if (fields.setPhone) patches.phone = fields.setPhone;
>   if (fields.setProvince) patches.province = fields.setProvince;
>   if (fields.setCity) patches.city = fields.setCity;
>   if (fields.setBrgy) patches.barangayName = fields.setBrgy;
>   return patches;
> }
> 
> async function persistProfile(
>   currentUser: MobileUserShape,
>   patches: Record<string, string>,
> ): Promise<boolean> {
>   if (Waste2GoodsAPI.saveProfile) return Waste2GoodsAPI.saveProfile(patches);
>   const userId = currentUser.id || currentUser.userId;
>   const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
>     method: "PUT",
>     headers: {
>       "Content-Type": "application/json",
>       Authorization: `Bearer ${Waste2GoodsAPI.getAuthState()?.token || ""}`,
>     },
>     body: JSON.stringify(patches),
>   });
>   return res.ok;
> }
> 
> function publishQrBridge(decodedText: string, currentUser: MobileUserShape) {
>   const auth = Waste2GoodsAPI.getAuthState();
>   const u = auth?.user || {};
>   const bridgePayload = {
>     user: {
>       id: (u as any).id || (u as any).userId || currentUser.id || "U-001",
>       userId: (u as any).id || (u as any).userId || currentUser.id || "U-001",
>       name: currentUser.name && currentUser.name !== "Guest User"
>         ? currentUser.name
>         : (u as any).name || `${(u as any).firstName || ""} ${(u as any).lastName || ""}`.trim() || "Registered User",
>       firstName: (u as any).firstName,
>       lastName: (u as any).lastName,
>       email: currentUser.email || (u as any).email || "",
>       points: currentUser.points ?? (u as any).pointsBalance ?? 0,
>       pointsBalance: currentUser.points ?? (u as any).pointsBalance ?? 0,
>     },
>     kioskPayload: decodedText,
>     timestamp: Date.now(),
>   };
>   localStorage.setItem("w2g_kiosk_qr_bridge", JSON.stringify(bridgePayload));
>   try {
>     window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge", newValue: JSON.stringify(bridgePayload) }));
>   } catch { /* ignore */ }
>   Waste2GoodsAPI.connectKioskSession?.({
>     userId: bridgePayload.user.id || bridgePayload.user.userId,
>     userName: bridgePayload.user.name,
>     kioskId: decodedText.includes("K-") ? decodedText : "K-01",
>   });
> }
> 
> function mapKioskSessionResponse(
>   res: { connected?: boolean; kioskId?: string; connectedAt?: number } | null,
>   prev: { connected: boolean; kioskId?: string; connectedAt?: number },
> ) {
>   if (!res) return { connected: false } as const;
>   return {
>     connected: !!res.connected,
>     kioskId: res.kioskId,
>     connectedAt: res.connected ? (res.connectedAt ?? prev.connectedAt ?? Date.now()) : undefined,
>   };
> }
> 
> type SetState<T> = React.Dispatch<React.SetStateAction<T>>;
> 
> function validateRegisterStep1(v: { full: string; email: string; phone?: string; pwd: string; confirm: string }, setError: SetState<string>): boolean {
>   setError("");
>   if (!v.full || !v.email || !v.pwd || !v.confirm) {
>     setError("Please fill in all fields: name, email, phone, password, confirm password");
>     return false;
>   }
>   if (v.pwd !== v.confirm) {
>     setError("Passwords do not match");
>     return false;
>   }
>   if (v.pwd.length < 6) {
>     setError("Password must be at least 6 characters");
>     return false;
>   }
>   return true;
> }
> 
> function validateRegisterAddress(v: { province: string; city: string; barangay: string }, setError: SetState<string>): boolean {
>   setError("");
>   if (!v.province || !v.city || !v.barangay) {
>     setError("Please select Province, City/Municipality, and Barangay");
>     return false;
>   }
>   return true;
> }
> 
> function validateRegisterAll(v: { full: string; email: string; pwd: string; confirm: string; province: string; city: string; barangay: string }, setError: SetState<string>, goStep: (n: number) => void): boolean {
>   setError("");
>   if (!v.full || !v.email || !v.pwd) {
>     setError("Please fill in all fields from Step 1");
>     goStep(0);
>     return false;
>   }
>   if (v.pwd !== v.confirm) {
>     setError("Passwords do not match");
>     goStep(0);
>     return false;
>   }
>   if (!v.province || !v.city || !v.barangay) {
>     setError("Please select Province, City, and Barangay in Step 2");
>     goStep(1);
>     return false;
>   }
>   return true;
> }
> 
> function splitFullName(full: string): { firstName: string; lastName: string } {
>   const names = full.trim().split(/\s+/);
>   return { firstName: names[0] || "User", lastName: names.slice(1).join(" ") || "Lastname" };
> }
> 
> function buildQrBridgePayload(authUser: any, currentUser: any, decodedText: string) {
>   const u = authUser || {};
>   const uid = u.id || u.userId || currentUser.id || "U-001";
>   const rawName = currentUser.name && currentUser.name !== "Guest User"
>     ? currentUser.name
>     : (u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Registered User");
>   const pts = currentUser.points ?? u.pointsBalance ?? 0;
>   return {
>     user: {
>       id: uid,
>       userId: uid,
>       name: rawName,
>       firstName: u.firstName,
>       lastName: u.lastName,
>       email: currentUser.email || u.email || "",
>       points: pts,
>       pointsBalance: pts,
>     },
>     kioskPayload: decodedText,
>     timestamp: Date.now(),
>   };
> }
> 
> type RegisterSubmitCtx = Readonly<{
>   full: string;
>   email: string;
>   pwd: string;
>   confirm: string;
>   phone: string;
>   province: string;
>   city: string;
>   barangay: string;
>   street: string;
> }>;
> 
> async function doRegisterSubmit(
>   ctx: RegisterSubmitCtx,
>   setError: SetState<string>,
>   setLoading: SetState<boolean>,
>   setProfileUser: SetState<any>,
>   setRegStep: SetState<number>,
>   go: (s: MobileScreen) => void,
>   targetAfter: MobileScreen,
> ): Promise<void> {
>   const goStep = (n: number) => setRegStep(n);
>   if (!validateRegisterAll(ctx, setError, goStep)) return;
>   const names = splitFullName(ctx.full);
>   try {
>     setLoading(true);
>     const regAuth = await Waste2GoodsAPI.register({
>       firstName: names.firstName,
>       lastName: names.lastName,
>       email: ctx.email,
>       password: ctx.pwd,
>       phone: ctx.phone,
>       province: ctx.province,
>       city: ctx.city,
>       barangayName: ctx.barangay,
>       streetAddress: ctx.street,
>     });
>     if (regAuth?.user) setProfileUser({ ...regAuth.user });
>     setLoading(false);
>     setRegStep(0);
>     go(targetAfter);
>   } catch (e) {
>     setLoading(false);
>     setError(e instanceof Error ? e.message : "Registration failed");
>     setRegStep(0);
>   }
> }
> 
> type MobileAppRouterProps = Readonly<{
>   screen: MobileScreen;
>   leaderTab: "weekly" | "monthly";
>   regStep: number;
>   selectedReward: typeof rewards[number] | null;
>   rewardFilter: string;
>   mfaCode: string[];
>   weighing: boolean;
>   email: string;
>   password: string;
>   loginError: string;
>   loginLoading: boolean;
>   regFullName: string;
>   regEmail: string;
>   regPassword: string;
>   regConfirmPassword: string;
>   regPhone: string;
>   regProvince: string;
>   regCity: string;
>   regBarangay: string;
>   regStreetAddress: string;
>   regLoading: boolean;
>   regError: string;
>   profileUser: any;
>   profileRank: string;
>   profileSaving: boolean;
>   profileBanner: { type: "ok" | "err"; text: string } | null;
>   setFName: string;
>   setLName: string;
>   setFormEmail: string;
>   setPhone: string;
>   setBrgy: string;
>   setCity: string;
>   setProvince: string;
>   notifItems: any[];
>   notifUnread: number;
>   kioskSession: { connected: boolean; kioskId?: string; connectedAt?: number };
>   kioskChecking: boolean;
>   kioskElapsedLabel?: string;
>   apiHost: string;
>   showLoginServer: boolean;
>   loginServerBanner: { type: "ok" | "err"; text: string } | null;
>   weight: any;
>   mfaRefs: React.RefObject<(HTMLInputElement | null)[]>;
>   availableCities: string[];
>   availableBarangays: string[];
>   currentUser: any;
>   mergedLeaderboard: any[];
>   profileSinceLabel: string;
>   rewardCategories: string[];
>   filteredRewards: typeof rewards;
>   setSelectedReward: (r: typeof rewards[number] | null) => void;
>   setRewardFilter: (v: string) => void;
>   setMfaCode: (v: string[]) => void;
>   setEmail: SetState<string>;
>   setPassword: SetState<string>;
>   setRegFullName: SetState<string>;
>   setRegEmail: SetState<string>;
>   setRegPassword: SetState<string>;
>   setRegConfirmPassword: SetState<string>;
>   setRegPhone: SetState<string>;
>   setRegProvince: SetState<string>;
>   setRegCity: SetState<string>;
>   setRegBarangay: SetState<string>;
>   setRegStreetAddress: SetState<string>;
>   setRegError: SetState<string>;
>   setRegStep: SetState<number>;
>   setLeaderTab: SetState<"weekly" | "monthly">;
>   setProfileBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
>   setSetFName: SetState<string>;
>   setSetLName: SetState<string>;
>   setSetFormEmail: SetState<string>;
>   setSetPhone: SetState<string>;
>   setSetBrgy: SetState<string>;
>   setSetCity: SetState<string>;
>   setSetProvince: SetState<string>;
>   setLoginServerBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
>   setApiHost: SetState<string>;
>   handleSaveProfile: () => Promise<void>;
>   handleDisconnectKiosk: () => Promise<void>;
>   onLogin: () => Promise<void>;
>   onRegisterStep1Next: () => void;
>   onRegisterStep2Next: () => void;
>   onRegisterStep3MFA: () => Promise<void>;
>   onRegisterStep3Skip: () => Promise<void>;
>   onToggleLoginServer: () => void;
>   onRewardRedeem: () => Promise<void>;
>   onRewardClose: () => void;
>   onSubmitConfirm: () => void;
>   onClaimed: (r: { newBalance: number; pointsAwarded: number; bottles: number }) => void;
>   go: (s: MobileScreen) => void;
> }>;
> 
> function MobileScreens(p: MobileAppRouterProps) {
>   const el = (
>     <div className="relative flex flex-col w-full flex-1 min-h-0" style={{ background: "#f0fdf4" }}>
>       <MobileScreenContent {...p} />
>     </div>
>   );
>   return el;
> }
> 
> function MobileScreenContent(p: MobileAppRouterProps) {
>   const s = p.screen;
>   switch (s) {
>     case "splash": return <ScreenSplash />;
>     case "onboard1": return <ScreenOnboard1 go={p.go} />;
>     case "onboard2": return <ScreenOnboard2 go={p.go} />;
>     case "onboard3": return <ScreenOnboard3 go={p.go} />;
>     case "register":
>       return (
>         <ScreenRegister
>           regStep={p.regStep}
>           regFullName={p.regFullName} regEmail={p.regEmail} regPhone={p.regPhone}
>           regPassword={p.regPassword} regConfirmPassword={p.regConfirmPassword}
>           regProvince={p.regProvince} regCity={p.regCity} regBarangay={p.regBarangay}
>           regStreetAddress={p.regStreetAddress}
>           regError={p.regError} regLoading={p.regLoading}
>           availableCities={p.availableCities} availableBarangays={p.availableBarangays}
>           setRegFullName={p.setRegFullName} setRegEmail={p.setRegEmail} setRegPhone={p.setRegPhone}
>           setRegPassword={p.setRegPassword} setRegConfirmPassword={p.setRegConfirmPassword}
>           setRegProvince={p.setRegProvince} setRegCity={p.setRegCity} setRegBarangay={p.setRegBarangay}
>           setRegStreetAddress={p.setRegStreetAddress} setRegError={p.setRegError}
>           setRegStep={p.setRegStep} go={p.go}
>           onStep1Next={p.onRegisterStep1Next} onStep2Next={p.onRegisterStep2Next}
>           onStep3MFA={p.onRegisterStep3MFA} onStep3Skip={p.onRegisterStep3Skip}
>         />
>       );
>     case "login":
>       return (
>         <ScreenLogin
>           email={p.email} password={p.password} loginError={p.loginError} loginLoading={p.loginLoading}
>           setEmail={p.setEmail} setPassword={p.setPassword}
>           showLoginServer={p.showLoginServer} loginServerBanner={p.loginServerBanner}
>           apiHost={p.apiHost} setApiHost={p.setApiHost}
>           onToggleLoginServer={p.onToggleLoginServer} onLogin={p.onLogin}
>           setLoginServerBanner={p.setLoginServerBanner} go={p.go}
>         />
>       );
>     case "profile-setup": return <ScreenProfileSetup currentUser={p.currentUser} go={p.go} />;
>     case "mfa": return <ScreenMFA mfaCode={p.mfaCode} setMfaCode={p.setMfaCode} mfaRefs={p.mfaRefs} go={p.go} />;
>     case "home": return <ScreenHome {...p} />;
>     case "rewards": return <ScreenRewards {...p} />;
>     case "submit": return <ScreenSubmit go={p.go} screen={s} currentUser={p.currentUser} />;
>     case "submit-scan": return <ScreenSubmitScan />;
>     case "submit-confirm": return <ScreenSubmitConfirm weight={p.weight} weighing={p.weighing} onConfirm={p.onSubmitConfirm} />;
>     case "submit-done": return <ScreenSubmitDone go={p.go} currentUser={p.currentUser} />;
>     case "tasks": return <ScreenTasks {...p} />;
>     case "leaderboard": return <ScreenLeaderboard {...p} />;
>     case "redeem-code": return <ScreenRedeemCode go={p.go} onClaimed={p.onClaimed} />;
>     case "notifications": return <ScreenNotifications {...p} />;
>     case "profile": return <ScreenProfile {...p} />;
>     case "settings": return <ScreenSettings {...p} />;
>     case "history": return <ScreenHistory {...p} />;
>     case "redeem-history": return <ScreenRedeemHistory {...p} />;
>     case "redeem-confirm":
>       return p.selectedReward ? <ScreenRedeemConfirm {...p} onRedeem={p.onRewardRedeem} onClose={p.onRewardClose} /> : <ScreenRewards {...p} />;
>     default:
>       return p.selectedReward ? <ScreenRewardDetail {...p} onClose={p.onRewardClose} onRedeem={p.onRewardRedeem} /> : <ScreenHome {...p} />;
>   }
> }
> 
> function ScreenSplash() {
>   return (
>     <div className="h-full flex flex-col items-center justify-center" style={{ background: "linear-gradient(160deg, #052e16 0%, #166534 45%, #0c4a6e 100%)" }}>
>       <div className="relative">
>         <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center" style={{ boxShadow: "0 0 80px rgba(34,197,94,0.3)" }}>
>           <Recycle className="w-12 h-12 text-white" />
>         </div>
>         <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-400 border-2 border-green-900 flex items-center justify-center">
>           <Leaf className="w-4 h-4 text-green-900" />
>         </div>
>       </div>
>       <h1 className="text-4xl font-black text-white mt-6 tracking-tight">Waste2Goods</h1>
>       <p className="text-green-300 text-sm mt-1 font-semibold">Recycle · Earn · Thrive</p>
>       <div className="mt-12 flex gap-1.5">
>         {[0, 1, 2].map(i => <div key={`item-${i}`} className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />)}
>       </div>
>     </div>
>   );
> }
> 
> function ScreenOnboard1({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
>         <div className="w-48 h-48 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(22,163,74,0.15)" }}>
>           <div className="text-8xl">♻️</div>
>         </div>
>         <div className="text-center">
>           <h2 className="text-3xl font-black text-foreground">Recycle for Rewards</h2>
>           <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Bring your plastic bottles, cardboard, and metal cans to any Waste2Goods kiosk and earn points instantly.</p>
>         </div>
>       </div>
>       <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
>         <div className="flex justify-center gap-2">
>           <div className="w-6 h-2 rounded-full bg-primary" /><div className="w-2 h-2 rounded-full bg-muted" /><div className="w-2 h-2 rounded-full bg-muted" />
>         </div>
>         <button type="button" onClick={() => go("onboard2")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Next</button>
>         <button type="button" onClick={() => go("login")} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip</button>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenOnboard2({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
>         <div className="w-48 h-48 rounded-full bg-blue-100 border-4 border-blue-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(14,165,233,0.15)" }}>
>           <div className="text-8xl">🏆</div>
>         </div>
>         <div className="text-center">
>           <h2 className="text-3xl font-black text-foreground">Climb the Leaderboard</h2>
>           <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Compete with neighbors and earn special recognition. Top recyclers win bonus rewards each week.</p>
>         </div>
>       </div>
>       <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
>         <div className="flex justify-center gap-2">
>           <div className="w-2 h-2 rounded-full bg-muted" /><div className="w-6 h-2 rounded-full bg-primary" /><div className="w-2 h-2 rounded-full bg-muted" />
>         </div>
>         <button type="button" onClick={() => go("onboard3")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Next</button>
>         <button type="button" onClick={() => go("login")} className="w-full text-center text-sm text-muted-foreground font-semibold">Skip</button>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenOnboard3({ go }: Readonly<{ go: (s: MobileScreen) => void }>) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col max-w-xl w-full mx-auto" style={{ background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)", paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
>         <div className="w-48 h-48 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center" style={{ boxShadow: "0 20px 60px rgba(217,119,6,0.15)" }}>
>           <div className="text-8xl">🎁</div>
>         </div>
>         <div className="text-center">
>           <h2 className="text-3xl font-black text-foreground">Redeem Real Rewards</h2>
>           <p className="text-muted-foreground text-sm mt-3 leading-relaxed">Turn points into groceries, load credits, school supplies, and partner vouchers — directly in the app.</p>
>         </div>
>       </div>
>       <div className="px-8 space-y-4 shrink-0" style={{ paddingBottom: "calc(3rem + var(--sab))" }}>
>         <div className="flex justify-center gap-2">
>           <div className="w-2 h-2 rounded-full bg-muted" /><div className="w-2 h-2 rounded-full bg-muted" /><div className="w-6 h-2 rounded-full bg-primary" />
>         </div>
>         <button type="button" onClick={() => go("register")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Create Account</button>
>         <button type="button" onClick={() => go("login")} className="w-full text-center text-sm font-semibold text-muted-foreground">Already have an account? <span className="text-primary">Sign in</span></button>
>       </div>
>     </div>
>   );
> }
> 
> type ScreenRegisterProps = Readonly<{
>   regStep: number;
>   regFullName: string; regEmail: string; regPhone: string;
>   regPassword: string; regConfirmPassword: string;
>   regProvince: string; regCity: string; regBarangay: string;
>   regStreetAddress: string;
>   regError: string; regLoading: boolean;
>   availableCities: string[]; availableBarangays: string[];
>   setRegFullName: SetState<string>; setRegEmail: SetState<string>; setRegPhone: SetState<string>;
>   setRegPassword: SetState<string>; setRegConfirmPassword: SetState<string>;
>   setRegProvince: SetState<string>; setRegCity: SetState<string>; setRegBarangay: SetState<string>;
>   setRegStreetAddress: SetState<string>; setRegError: SetState<string>;
>   setRegStep: SetState<number>;
>   go: (s: MobileScreen) => void;
>   onStep1Next: () => void;
>   onStep2Next: () => void;
>   onStep3MFA: () => Promise<void>;
>   onStep3Skip: () => Promise<void>;
> }>;
> 
> function ScreenRegister(p: ScreenRegisterProps) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col overflow-y-auto"
>       style={{ paddingTop: "calc(0.5rem + var(--sat))", paddingBottom: "calc(1.5rem + var(--sab))" }}>
>       <div className="px-5 py-3 flex items-center gap-3 border-b border-border bg-white sticky top-0 z-20" style={{ top: "var(--sat)" }}>
>         <button type="button" onClick={() => p.go("onboard3")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <div>
>           <h2 className="text-base font-black text-foreground">Create Account</h2>
>           <div className="flex gap-1 mt-1">
>             {[1, 2, 3].map(s => <div key={s} className={`h-1 rounded-full transition-all ${p.regStep >= s - 1 ? "bg-primary w-8" : "bg-muted w-4"}`} />)}
>           </div>
>         </div>
>       </div>
>       <div className="p-5 md:p-8 flex-1 max-w-xl w-full mx-auto">
>         {p.regStep === 0 && (
>           <div className="space-y-4">
>             <div>
>               <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">Step 1 of 3 — Account Info</p>
>               <div className="space-y-3">
>                 <Field label="Full Name" placeholder="Maria Santos" icon={<User className="w-4 h-4" />} value={p.regFullName} onChange={p.setRegFullName} />
>                 <Field label="Email Address" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.regEmail} onChange={p.setRegEmail} />
>                 <Field label="Phone Number" placeholder="+63 912 345 6789" icon={<Phone className="w-4 h-4" />} value={p.regPhone} onChange={p.setRegPhone} />
>                 <Field label="Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.regPassword} onChange={p.setRegPassword} />
>                 <Field label="Confirm Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.regConfirmPassword} onChange={p.setRegConfirmPassword} />
>               </div>
>             </div>
>             {p.regError && (
>               <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
>                 <AlertCircle className="w-4 h-4" />
>                 <span>{p.regError}</span>
>               </div>
>             )}
>             <button type="button" onClick={p.onStep1Next} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Continue</button>
> 
>             <div className="flex items-center gap-3 pt-2">
>               <div className="flex-1 h-px bg-border" />
>               <span className="text-xs text-muted-foreground font-semibold">or sign up with</span>
>               <div className="flex-1 h-px bg-border" />
>             </div>
> 
>             <button
>               type="button"
>               onClick={() => {
>                 // Direct backend Google OAuth — works without Appwrite configuration
>                 const redirectUri = `${window.location.origin}/`;
>                 window.location.href = `${getApiBaseUrl()}/auth/google?return_to=${encodeURIComponent(redirectUri)}`;
>               }}
>               className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all no-underline"
>             >
>               <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
>                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
>                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
>                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
>                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
>               </svg>
>               <span>Sign up with Google</span>
>             </button>
> 
>             <button
>               type="button"
>               onClick={() => {
>                 const redirectUri = `${window.location.origin}/`;
>                 window.location.href = `${getApiBaseUrl()}/auth/github?return_to=${encodeURIComponent(redirectUri)}`;
>               }}
>               className="w-full py-3 px-4 rounded-2xl border border-slate-900 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all no-underline"
>             >
>               <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
>                 <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
>               </svg>
>               <span>Sign up with GitHub</span>
>             </button>
>           </div>
>         )}
>         {p.regStep === 1 && (
>           <div className="space-y-4">
>             <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 2 of 3 — Community Address</p>
>             {p.regError && (
>               <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
>                 <AlertCircle className="w-4 h-4" />
>                 <span>{p.regError}</span>
>               </div>
>             )}
>             <p className="text-xs text-muted-foreground mb-1">
>               Select your <strong>Province</strong> first — City and Barangay options will auto-filter based on your choice.
>             </p>
>             <SelectField label="Province" placeholder="Select a Province..." icon={<MapPin className="w-4 h-4" />} value={p.regProvince} options={PROVINCES} onChange={(v) => { p.setRegProvince(v); p.setRegCity(""); p.setRegBarangay(""); }} />
>             <SelectField label="City / Municipality" placeholder={p.regProvince ? "Select a City..." : "Select a Province first"} icon={<MapPin className="w-4 h-4" />} value={p.regCity} options={p.availableCities} disabled={!p.regProvince} onChange={(v) => { p.setRegCity(v); p.setRegBarangay(""); }} />
>             <SelectField label="Barangay" placeholder={p.regCity ? "Select a Barangay..." : "Select a City first"} icon={<MapPin className="w-4 h-4" />} value={p.regBarangay} options={p.availableBarangays} disabled={!p.regCity} onChange={p.setRegBarangay} />
>             <Field label="Street / House / Building No." placeholder="e.g. Block 12 Lot 5, Rizal Street or Purok 7" icon={<MapPin className="w-4 h-4" />} value={p.regStreetAddress} onChange={p.setRegStreetAddress} />
>             <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex gap-2">
>               <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
>               <p className="text-xs text-emerald-800 font-semibold">
>                 No Region required. Leaderboards are based on Barangay level only; the street address above is used for delivery of redeemed items.
>               </p>
>             </div>
>             <button type="button" onClick={p.onStep2Next} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Continue</button>
>             <button type="button" onClick={() => p.setRegStep(0)} className="w-full text-center text-sm text-muted-foreground font-semibold">Back</button>
>           </div>
>         )}
>         {p.regStep === 2 && (
>           <div className="space-y-4">
>             <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">Step 3 of 3 — Security</p>
>             <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
>               <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
>               <p className="text-xs text-blue-700 font-semibold leading-relaxed">Enable Multi-Factor Authentication to protect your account and points balance from unauthorized access.</p>
>             </div>
>             {p.regError && (
>               <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
>                 <AlertCircle className="w-4 h-4" />
>                 <span>{p.regError}</span>
>               </div>
>             )}
>             <div className="grid grid-cols-4 gap-3 my-4">
>               {[
>                 { i: "📱", l: "SMS" }, { i: "🔐", l: "Authenticator" },
>                 { i: "📧", l: "Email" }, { i: "🆔", l: "Barangay ID" },
>               ].map((o) => (
>                 <label key={o.l} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${o.l === "SMS" ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
>                   <div className="text-2xl">{o.i}</div>
>                   <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">{o.l}</div>
>                 </label>
>               ))}
>             </div>
>             <button type="button" disabled={p.regLoading} onClick={p.onStep3MFA} className={`w-full py-4 ${BTN_PRIMARY_CLS} disabled:opacity-60`}>
>               {p.regLoading ? "Creating account..." : "Enable MFA & Continue"}
>             </button>
>             <button type="button" disabled={p.regLoading} onClick={p.onStep3Skip} className="w-full text-center text-sm text-muted-foreground font-semibold disabled:opacity-60">Skip for now</button>
>           </div>
>         )}
>       </div>
>     </div>
>   );
> }
> 
> type ScreenLoginProps = Readonly<{
>   email: string; password: string; loginError: string; loginLoading: boolean;
>   setEmail: SetState<string>; setPassword: SetState<string>;
>   showLoginServer: boolean; loginServerBanner: { type: "ok" | "err"; text: string } | null;
>   apiHost: string; setApiHost: SetState<string>;
>   onToggleLoginServer: () => void; onLogin: () => Promise<void>;
>   setLoginServerBanner: SetState<{ type: "ok" | "err"; text: string } | null>;
>   go: (s: MobileScreen) => void;
> }>;
> 
> function ScreenLogin(p: ScreenLoginProps) {
>   return (
>     <div className="h-full min-h-[100dvh] flex flex-col overflow-y-auto"
>       style={{ paddingTop: "calc(0.75rem + var(--sat))", paddingBottom: "calc(1.5rem + var(--sab))" }}>
>       <div className="flex flex-col items-center gap-2 px-8 pt-4 pb-3 shrink-0">
>         <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
>           <Recycle className="w-7 h-7 text-primary" />
>         </div>
>         <h2 className="text-2xl font-black text-foreground">Welcome back!</h2>
>         <p className="text-muted-foreground text-sm text-center">Sign in to your Waste2Goods account</p>
>       </div>
>       <div className="px-6 flex flex-1 flex-col w-full max-w-xl mx-auto space-y-3">
>         <Field label="Email Address" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.email} onChange={p.setEmail} />
>         <Field label="Password" placeholder="••••••••" type="password" icon={<Lock className="w-4 h-4" />} value={p.password} onChange={p.setPassword} />
>         <p className="text-right text-xs text-primary font-bold cursor-pointer shrink-0">Forgot Password?</p>
>         {p.loginError && (
>           <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0">
>             <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
>             <span>{p.loginError}</span>
>           </div>
>         )}
>         {isServerIpPanelEnabled() && (
>           <button type="button" onClick={p.onToggleLoginServer} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-bold text-foreground shrink-0">
>             <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Server IP Settings</span>
>             <ChevronRight className={`w-4 h-4 transition-transform ${p.showLoginServer ? "rotate-90" : ""}`} />
>           </button>
>         )}
>         {isServerIpPanelEnabled() && p.showLoginServer && (
>           <div className="space-y-2 shrink-0">
>             {p.loginServerBanner && (
>               <div className={`rounded-xl px-3 py-2 text-xs font-bold ${p.loginServerBanner.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{p.loginServerBanner.text}</div>
>             )}
>             <ServerIpPanel apiHost={p.apiHost} setApiHost={p.setApiHost} onSaved={p.setLoginServerBanner} compact />
>           </div>
>         )}
>         <div className="mt-auto space-y-2.5 pt-2 shrink-0">
>           <button type="button" disabled={p.loginLoading} onClick={p.onLogin} className={`w-full py-3.5 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60 flex items-center justify-center gap-2`}>
>             {p.loginLoading ? "Signing in..." : "Sign In"}
>           </button>
> 
>           <div className="flex items-center gap-3 pt-1">
>             <div className="flex-1 h-px bg-border" />
>             <span className="text-xs text-muted-foreground font-semibold">or sign in with</span>
>             <div className="flex-1 h-px bg-border" />
>           </div>
> 
>           <button
>             type="button"
>             onClick={() => {
>               // Direct backend Google OAuth — works without Appwrite configuration
>               const redirectUri = `${window.location.origin}/`;
>               window.location.href = `${getApiBaseUrl()}/auth/google?return_to=${encodeURIComponent(redirectUri)}`;
>             }}
>             className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all no-underline"
>           >
>             <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
>               <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
>               <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
>               <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
>               <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
>             </svg>
>             <span>Continue with Google</span>
>           </button>
> 
>           <button
>             type="button"
>             onClick={() => {
>               // Direct backend GitHub OAuth — works without Appwrite configuration
>               const redirectUri = `${window.location.origin}/`;
>               window.location.href = `${getApiBaseUrl()}/auth/github?return_to=${encodeURIComponent(redirectUri)}`;
>             }}
>             className="w-full py-3 px-4 rounded-2xl border border-slate-900 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all no-underline"
>           >
>             <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
>               <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
>             </svg>
>             <span>Continue with GitHub</span>
>           </button>
>         </div>
>       </div>
>       <p className="text-center text-xs text-muted-foreground pt-5 shrink-0">New resident? <button type="button" onClick={() => p.go("register")} className="text-primary font-bold">Create account</button></p>
>     </div>
>   );
> }
> 
> function ScreenProfileSetup({ currentUser, go }: Readonly<{ currentUser: any; go: (s: MobileScreen) => void }>) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="px-5 py-3 flex items-center gap-3 border-b border-border bg-white sticky top-0 z-20" style={{ top: "var(--sat)" }}>
>         <button type="button" onClick={() => go("register")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <div>
>           <h2 className="text-base font-black text-foreground">Almost done!</h2>
>           <p className="text-xs text-muted-foreground">Complete your profile to customize your account</p>
>         </div>
>       </div>
>       <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-24">
>         <div className="flex flex-col items-center gap-3">
>           <div className="relative">
>             <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
>               <User className="w-10 h-10 text-primary/40" />
>             </div>
>             <button type="button" className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-white">
>               <Camera className="w-3.5 h-3.5 text-white" />
>             </button>
>           </div>
>           <p className="text-xs text-muted-foreground font-semibold">Upload a profile photo (optional)</p>
>         </div>
>         <Field label="Display Name" placeholder="Your display name" icon={<User className="w-4 h-4" />} defaultVal={currentUser.name && currentUser.name !== "Guest User" ? currentUser.name : ""} />
>         <div>
>           <label htmlFor="profile-bio" className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1 block">Bio (optional)</label>
>           <textarea id="profile-bio" className={INPUT_BASE_CLS} rows={3} placeholder="I recycle because I care about my community..." />
>         </div>
>         <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex gap-2">
>           <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
>           <p className="text-xs text-emerald-700 font-semibold">Start recycling at a nearby kiosk to earn your first points!</p>
>         </div>
>         <button type="button" onClick={() => go("home")} className={`w-full py-4 ${BTN_PRIMARY_CLS}`}>Start Recycling!</button>
>       </div>
>     </div>
>   );
> }
> 
> type ScreenMFAProps = Readonly<{ mfaCode: string[]; setMfaCode: (v: string[]) => void; mfaRefs: React.RefObject<(HTMLInputElement | null)[]>; go: (s: MobileScreen) => void; }>;
> function ScreenMFA({ mfaCode, setMfaCode, mfaRefs, go }: ScreenMFAProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 gap-7 overflow-y-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
>         <Shield className="w-8 h-8 text-blue-600" />
>       </div>
>       <div className="text-center">
>         <h2 className="text-2xl font-black text-foreground">Verify Your Phone</h2>
>         <p className="text-sm text-muted-foreground mt-2 leading-relaxed">We sent a 6-digit code to <strong>+63 912 *** 6789</strong>. Enter it below.</p>
>       </div>
>       <div className="flex gap-2">
>         {mfaCode.map((d, i) => (
>           <input key={`mfa-digit-${["one", "two", "three", "four", "five", "six"][i]}`}
>             ref={el => { mfaRefs.current[i] = el; }}
>             value={d}
>             maxLength={1}
>             onChange={e => {
>               const v = e.target.value.replace(/\D/g, "");
>               if (!v) { setMfaCode(mfaCode.map((c, idx) => idx === i ? "" : c)); return; }
>               const copy = [...mfaCode]; copy[i] = v; setMfaCode(copy);
>               if (v && i < 5) mfaRefs.current[i + 1]?.focus();
>               if (!v && i > 0) mfaRefs.current[i - 1]?.focus();
>             }}
>             onKeyDown={e => { if (e.key === "Backspace" && !mfaCode[i] && i > 0) { mfaRefs.current[i - 1]?.focus(); } }}
>             inputMode="numeric"
>             className={`w-12 h-14 rounded-xl border-2 text-center text-xl font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${mfaCode[i] ? "border-primary bg-primary/5" : "border-border bg-white"}`}
>           />
>         ))}
>       </div>
>       <p className="text-xs text-muted-foreground">Didn't receive a code? <span className="text-primary font-bold">Resend</span></p>
>       <button type="button" onClick={() => go("profile-setup")} className={`w-full max-w-xs py-4 ${BTN_PRIMARY_CLS} text-base`}>Verify & Continue</button>
>     </div>
>   );
> }
> 
> function ScreenSubmit({
>   go,
>   screen,
>   currentUser,
> }: Readonly<{
>   go: (s: MobileScreen) => void;
>   screen: MobileScreen;
>   currentUser: MobileUserShape;
> }>) {
>   const [manualCode, setManualCode] = useState("K-01");
>   const [connecting, setConnecting] = useState(false);
> 
>   const handleConnectKiosk = (code: string) => {
>     const kId = code.trim().toUpperCase() || "K-01";
>     setConnecting(true);
>     publishQrBridge(kId, currentUser);
>     setTimeout(() => {
>       setConnecting(false);
>       go("submit-confirm");
>     }, 600);
>   };
> 
>   const nearbyKiosks = [
>     { id: "K-01", name: "Cabantian Barangay Hall Kiosk", status: "Online", dist: "50m away" },
>     { id: "K-02", name: "Cabantian Elementary School", status: "Online", dist: "320m away" },
>     { id: "K-04", name: "Cabantian Covered Court", status: "Online", dist: "650m away" },
>   ];
> 
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ top: "var(--sat)" }}>
>         <button type="button" onClick={() => go("home")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <div>
>           <h2 className="text-base font-black text-foreground">Submit Recycling</h2>
>           <p className="text-xs text-muted-foreground">Select a kiosk, enter code, or scan QR</p>
>         </div>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-28">
>         {/* Quick Kiosk Selection */}
>         <div className="bg-white p-4 rounded-2xl border border-border space-y-3">
>           <div className="flex items-center justify-between">
>             <p className="text-xs font-black text-foreground uppercase tracking-wide">Quick Connect: Nearby Kiosks</p>
>             <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">● Ready</span>
>           </div>
>           <div className="space-y-2">
>             {nearbyKiosks.map(k => (
>               <button
>                 key={k.id}
>                 type="button"
>                 onClick={() => handleConnectKiosk(k.id)}
>                 className="w-full p-3 rounded-xl border border-border hover:border-primary hover:bg-green-50/50 transition-all flex items-center justify-between text-left"
>               >
>                 <div className="flex items-center gap-3">
>                   <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center font-mono font-black text-xs text-green-800">
>                     {k.id}
>                   </div>
>                   <div>
>                     <p className="text-xs font-black text-foreground">{k.name}</p>
>                     <p className="text-[10px] text-muted-foreground">{k.dist} • {k.status}</p>
>                   </div>
>                 </div>
>                 <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors">
>                   Connect
>                 </span>
>               </button>
>             ))}
>           </div>
>         </div>
> 
>         {/* Manual Kiosk Code Input */}
>         <div className="p-5 rounded-2xl border border-border bg-white space-y-3">
>           <div className="flex items-center gap-3">
>             <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center"><Keyboard className="w-5 h-5" /></div>
>             <div>
>               <p className="font-black text-sm text-foreground">Enter Kiosk Code Manually</p>
>               <p className="text-xs text-muted-foreground">Type the kiosk ID (e.g., K-01, K-02) shown on screen</p>
>             </div>
>           </div>
>           <div className="flex gap-2">
>             <div className="relative flex-1">
>               <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
>               <input
>                 value={manualCode}
>                 onChange={e => setManualCode(e.target.value.toUpperCase())}
>                 placeholder="K-01"
>                 className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border font-mono font-black text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
>               />
>             </div>
>             <button
>               type="button"
>               disabled={connecting || !manualCode.trim()}
>               onClick={() => handleConnectKiosk(manualCode)}
>               className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
>             >
>               {connecting ? "Linking..." : "Link & Weigh"}
>             </button>
>           </div>
>         </div>
> 
>         {/* Camera QR Alternative */}
>         <button type="button" onClick={() => go("submit-scan")} className="w-full text-left p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-3">
>           <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><ScanLine className="w-5 h-5" /></div>
>           <div className="flex-1">
>             <p className="font-black text-xs text-foreground">Or Scan Kiosk QR Code</p>
>             <p className="text-[10px] text-muted-foreground">Optional: Point camera at kiosk screen to connect</p>
>           </div>
>           <ChevronRight className="w-4 h-4 text-muted-foreground" />
>         </button>
> 
>         <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-2.5">
>           <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
>           <p className="text-xs text-blue-700 font-semibold leading-relaxed">Once connected, drop items into the weighing receptacle on the kiosk. Points will calculate and deposit directly to your wallet.</p>
>         </div>
>       </div>
>       <MobileBottomNav screen={screen} go={go} />
>     </div>
>   );
> }
> 
> function ScreenSubmitScan() {
>   return (
>     <div className="min-h-[100dvh] flex flex-col bg-black" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="px-5 py-3 flex items-center gap-3 border-b border-white/10 sticky top-0 z-10" style={{ top: "var(--sat)" }}>
>         <h2 className="text-base font-black text-white flex-1 text-center pr-10">Scan Kiosk QR</h2>
>       </div>
>       <div className="flex-1 relative overflow-hidden flex items-center justify-center">
>         <div id="qr-reader" className="w-full max-w-md" />
>         <div className="absolute inset-0 pointer-events-none">
>           <div className="w-64 h-64 rounded-3xl border-[3px] border-green-400/80 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
>           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64">
>             <div className="h-[3px] w-full bg-green-400 rounded-full animate-pulse" />
>           </div>
>         </div>
>         <p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs text-white/80 font-semibold text-center w-full px-8">Align the QR code within the frame</p>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenSubmitConfirm({ weight, weighing, onConfirm }: Readonly<{ weight: any; weighing: boolean; onConfirm: () => void }>) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ top: "var(--sat)" }}>
>         <h2 className="text-base font-black text-foreground flex-1 text-center pr-10">Weighing Items</h2>
>       </div>
>       <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
>         <div className="relative">
>           <div className="w-56 h-56 rounded-full border-[6px] border-border bg-white flex items-center justify-center" style={{ boxShadow: "inset 0 -8px 32px rgba(0,0,0,0.05), 0 10px 40px rgba(34,197,94,0.1)" }}>
>             <div className="flex flex-col items-center">
>               <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${weighing ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{weighing ? "Measuring..." : "Place items"}</span>
>               <AnimatedNumber value={weight as number} suffix=" kg" className="text-5xl font-black text-foreground mt-3 tracking-tight" />
>               <p className="text-xs text-muted-foreground mt-2">~ <AnimatedNumber value={Math.round((weight as number) * 10)} suffix=" pts earned" className="text-xs font-black text-primary" /></p>
>             </div>
>           </div>
>           {Array.from({ length: 12 }).map((_, i) => (
>             <div key={`item-${i}`} className="absolute left-1/2 top-1/2 w-0.5 h-3 bg-muted-foreground/30 origin-bottom" style={{ transform: `translate(-50%, -100%) rotate(${i * 30}deg) translateY(-108px)` }} />
>           ))}
>         </div>
>         <div className="w-full max-w-md space-y-2">
>           {[
>             { m: "PET Bottle", w: "0.8 kg", p: "+8 pts", c: "bg-blue-50 border-blue-200", ic: "🧴" },
>             { m: "Cardboard", w: "1.2 kg", p: "+12 pts", c: "bg-amber-50 border-amber-200", ic: "📦" },
>             { m: "Aluminum Can", w: "0.3 kg", p: "+3 pts", c: "bg-emerald-50 border-emerald-200", ic: "🥫" },
>           ].map(r => (
>             <div key={r.m} className={`flex items-center gap-3 p-3 rounded-xl border ${r.c}`}>
>               <div className="text-2xl">{r.ic}</div>
>               <div className="flex-1">
>                 <p className="text-xs font-black text-foreground">{r.m}</p>
>                 <p className="text-[10px] text-muted-foreground">{r.w}</p>
>               </div>
>               <p className="text-xs font-black text-primary">{r.p}</p>
>             </div>
>           ))}
>         </div>
>         <div className="w-full max-w-md space-y-3 pt-2">
>           <div className="flex items-center justify-between text-sm px-1">
>             <span className="text-muted-foreground font-semibold">Estimated points</span>
>             <span className="font-black text-primary">+{Math.round((weight as number) * 10)} pts</span>
>           </div>
>           <button type="button" onClick={onConfirm} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Confirm & Earn Points</button>
>         </div>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenSubmitDone({ go, currentUser }: Readonly<{ go: (s: MobileScreen) => void; currentUser: any }>) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 gap-6 overflow-y-auto" style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}>
>       <div className="relative">
>         <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
>           <CheckCircle2 className="w-14 h-14 text-green-500" />
>         </div>
>         <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary border-4 border-white flex items-center justify-center">
>           <Sparkles className="w-4 h-4 text-white" />
>         </div>
>       </div>
>       <div className="text-center space-y-2">
>         <h2 className="text-3xl font-black text-foreground">Points Earned!</h2>
>         <p className="text-5xl font-black text-primary tracking-tight">+23 pts</p>
>         <p className="text-muted-foreground text-sm mt-2">2.3 kg recycled · Thank you, {currentUser.initials}!</p>
>       </div>
>       <div className="w-full max-w-md space-y-3">
>         <div className="rounded-2xl border border-border bg-white p-4 flex items-center gap-4">
>           <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><Trophy className="w-6 h-6 text-green-500" /></div>
>           <div>
>             <p className="text-xs text-muted-foreground font-semibold">New balance</p>
>             <p className="font-black text-foreground">{Number(currentUser.points || 0) + 23} total points</p>
>           </div>
>         </div>
>         <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
>           <Leaf className="w-5 h-5 text-amber-600 flex-shrink-0" />
>           <p className="text-xs text-amber-700 font-semibold leading-relaxed">🌍 You saved ~2.5 kg CO₂ today. Keep going!</p>
>         </div>
>         <button type="button" onClick={() => go("home")} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base`}>Back to Home</button>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenHome(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <div>
>           <p className="text-xs text-muted-foreground font-semibold">Good morning,</p>
>           <h2 className="text-xl font-black text-foreground">{(p.currentUser.name && p.currentUser.name.trim() !== "") ? `${p.currentUser.name.split(" ")[0]} 👋` : "👋"}</h2>
>         </div>
>         <div className="flex items-center gap-2">
>           <button type="button" onClick={() => p.go("notifications")} className="relative p-2.5 rounded-xl border border-border bg-white hover:bg-secondary transition-colors">
>             <Bell className="w-5 h-5 text-muted-foreground" />
>             {p.notifUnread > 0 && (
>               <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">{p.notifUnread <= 9 ? p.notifUnread : "9+"}</span>
>             )}
>           </button>
>           <button type="button" onClick={() => p.go("profile")} className="w-10 h-10 rounded-full bg-primary text-white font-black text-sm flex items-center justify-center">{p.currentUser.initials}</button>
>         </div>
>       </div>
>       <div className="p-5 space-y-5 overflow-y-auto flex-1 pb-32">
>         <div className="rounded-3xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #166534 0%, #14532d 50%, #0c4a6e 100%)", boxShadow: "0 20px 50px rgba(22,101,52,0.3)" }}>
>           <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
>           <div className="absolute -right-16 bottom-0 w-56 h-56 rounded-full bg-white/5" />
>           <div className="relative">
>             <div className="flex items-center justify-between mb-4">
>               <div>
>                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-200">Points Balance</p>
>                 <h3 className="text-4xl font-black mt-1 tracking-tight">{p.currentUser.points?.toLocaleString()}</h3>
>                 <p className="text-[11px] text-green-200 mt-0.5">{p.profileSinceLabel}</p>
>               </div>
>               <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">{p.profileRank}</span>
>             </div>
>             <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
>               {[
>                 { l: "Recycled", v: `${(p.currentUser.totalKg || 0).toFixed(1)} kg`, i: <Recycle className="w-4 h-4" /> },
>                 { l: "Streak", v: `${p.currentUser.streak || 0} d`, i: <Flame className="w-4 h-4" /> },
>                 { l: "Badges", v: `${p.currentUser.badges || 0}`, i: <Award className="w-4 h-4" /> },
>               ].map(s => (
>                 <div key={s.l} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/5">
>                   <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">{s.i}</div>
>                   <p className="text-sm font-black">{s.v}</p>
>                   <p className="text-[9px] text-green-200 font-bold uppercase tracking-wider">{s.l}</p>
>                 </div>
>               ))}
>             </div>
>           </div>
>         </div>
>         <div className="grid grid-cols-2 gap-3">
>           <button type="button" onClick={() => p.go("submit")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
>             <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3"><Upload className="w-5 h-5 text-primary" /></div>
>             <p className="text-sm font-black text-foreground">Submit Items</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Scan QR at kiosk</p>
>           </button>
>           <button type="button" onClick={() => p.go("rewards")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
>             <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><Gift className="w-5 h-5 text-amber-500" /></div>
>             <p className="text-sm font-black text-foreground">Redeem Rewards</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Spend your points</p>
>           </button>
>           <button type="button" onClick={() => p.go("tasks")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
>             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3"><CheckSquare2 className="w-5 h-5 text-blue-500" /></div>
>             <p className="text-sm font-black text-foreground">Daily Tasks</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Earn bonus points</p>
>           </button>
>           <button type="button" onClick={() => p.go("leaderboard")} className="rounded-2xl p-4 text-left bg-white border border-border hover:border-primary transition-colors">
>             <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3"><Trophy className="w-5 h-5 text-purple-500" /></div>
>             <p className="text-sm font-black text-foreground">Leaderboard</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Top barangay recyclers</p>
>           </button>
>         </div>
>         <button type="button" onClick={() => p.go("redeem-code")} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-primary/40 hover:bg-green-50 transition-colors text-left">
>           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Hash className="w-5 h-5 text-primary" /></div>
>           <div className="flex-1">
>             <p className="text-sm font-black text-foreground">Redeem Receipt Code</p>
>             <p className="text-[10px] text-muted-foreground mt-0.5">Enter the code from the bottle machine</p>
>           </div>
>           <ChevronRight className="w-4 h-4 text-muted-foreground" />
>         </button>
>         {p.kioskSession.connected && (
>           <button type="button" onClick={p.handleDisconnectKiosk} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors">
>             <div className="flex items-center gap-3">
>               <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center"><Cable className="w-4 h-4 text-emerald-900" /></div>
>               <div className="text-left">
>                 <p className="text-xs font-black">Linked to {p.kioskSession.kioskId || "kiosk"}</p>
>                 <p className="text-[10px] text-emerald-700 font-semibold">{p.kioskElapsedLabel || "Active session"}{p.kioskChecking ? " · checking..." : ""}</p>
>               </div>
>             </div>
>             <span className="text-[10px] font-bold bg-emerald-400 text-emerald-900 px-2 py-1 rounded-full">Tap to disconnect</span>
>           </button>
>         )}
>         <div className="space-y-3">
>           <div className="flex items-center justify-between">
>             <div>
>               <p className="text-sm font-black text-foreground">Community Leaderboard</p>
>               <p className="text-[10px] text-muted-foreground font-semibold">Top residents &amp; your barangay rank</p>
>             </div>
>             <button type="button" onClick={() => p.go("leaderboard")} className="text-xs font-bold text-primary hover:underline">
>               View all ({p.mergedLeaderboard.length}) →
>             </button>
>           </div>
> 
>           <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-xs divide-y divide-border">
>             {/* Top 3 Residents */}
>             {p.mergedLeaderboard.slice(0, 3).map((u: any, i: number) => {
>               const isYou = u._isYou || u.isMe;
>               return (
>                 <div key={u.id || u.userId || `top-${i}`} className={`flex items-center gap-3 px-4 py-3 ${isYou ? "bg-green-50/70" : ""}`}>
>                   <RankIcon rank={i + 1} />
>                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ${isYou ? "bg-primary text-white ring-2 ring-primary/30" : "bg-gradient-to-br from-primary to-emerald-600 text-white"}`}>
>                     {u._initials}
>                   </div>
>                   <div className="flex-1 min-w-0">
>                     <div className="flex items-center gap-1.5">
>                       <p className="text-sm font-black text-foreground truncate">{u.displayName}</p>
>                       {isYou && <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>}
>                     </div>
>                     <p className="text-[10px] text-muted-foreground font-semibold">{u.barangay || "Cabantian"} · Level {Math.floor(Number(u.points || 0) / 500) + 1}</p>
>                   </div>
>                   <div className="text-right">
>                     <p className="text-sm font-black text-primary">{Number(u.points || 0).toLocaleString()} pts</p>
>                     <p className="text-[10px] text-muted-foreground">{(u.totalKg || 0).toFixed(1)} kg</p>
>                   </div>
>                 </div>
>               );
>             })}
> 
>             {/* If current user is not in top 3, show their row pinned below */}
>             {(() => {
>               const myEntry = p.mergedLeaderboard.find((u: any) => u._isYou || u.isMe);
>               if (myEntry && myEntry.rank > 3) {
>                 return (
>                   <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-primary/20">
>                     <span className="w-6 text-center text-xs font-black text-primary font-mono">#{myEntry.rank}</span>
>                     <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ring-2 ring-primary/30">
>                       {myEntry._initials}
>                     </div>
>                     <div className="flex-1 min-w-0">
>                       <div className="flex items-center gap-1.5">
>                         <p className="text-sm font-black text-foreground truncate">{myEntry.displayName}</p>
>                         <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>
>                       </div>
>                       <p className="text-[10px] text-primary font-semibold">{myEntry.barangay || "Cabantian"} · Your Current Standing</p>
>                     </div>
>                     <div className="text-right">
>                       <p className="text-sm font-black text-primary">{Number(myEntry.points || 0).toLocaleString()} pts</p>
>                       <p className="text-[10px] text-muted-foreground">{(myEntry.totalKg || 0).toFixed(1)} kg</p>
>                     </div>
>                   </div>
>                 );
>               }
>               return null;
>             })()}
>           </div>
>         </div>
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenRewards(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <div>
>           <p className="text-xs text-muted-foreground font-semibold">Points: <span className="text-primary font-black">{p.currentUser.points?.toLocaleString()}</span></p>
>           <h2 className="text-xl font-black text-foreground">Rewards Catalog</h2>
>         </div>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
>         <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
>           {p.rewardCategories.map(c => (
>             <button type="button" key={c} onClick={() => p.setRewardFilter(c)} className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${p.rewardFilter === c ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{c}</button>
>           ))}
>         </div>
>         <div className="grid grid-cols-2 gap-3">
>           {p.filteredRewards.map(r => {
>             const canRedeem = (Number(p.currentUser.points || 0) >= r.cost);
>             const cls = canRedeem ? "bg-primary text-white" : "bg-muted text-muted-foreground";
>             return (
>               <button
>                 type="button"
>                 key={r.name}
>                 onClick={() => p.setSelectedReward(r)}
>                 className={`rounded-2xl border bg-white text-left overflow-hidden transition-all hover:shadow-md cursor-pointer ${canRedeem ? "border-green-200 hover:border-primary ring-1 ring-green-100" : "border-border hover:border-muted-foreground/40"
>                   }`}
>               >
>                 <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center text-5xl">
>                   <div className="text-5xl">{r.icon}</div>
>                   {r.seasonal && <div className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">⭐ Seasonal</div>}
>                 </div>
>                 <div className="p-3 space-y-1.5">
>                   <p className="text-sm font-black text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">{r.name}</p>
>                   <div className="flex items-center justify-between pt-1">
>                     <span className={`font-black px-2.5 py-1 rounded-full ${cls}`}>{r.cost} pts</span>
>                     <span className="text-[10px] text-muted-foreground font-bold capitalize">{r.category}</span>
>                   </div>
>                 </div>
>               </button>
>             );
>           })}
>         </div>
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>       {p.selectedReward && (
>         <ScreenRewardDetail {...p} onClose={p.onRewardClose} onRedeem={p.onRewardRedeem} />
>       )}
>     </div>
>   );
> }
> 
> type DetailProps = MobileAppRouterProps & Readonly<{ onClose: () => void; onRedeem: () => Promise<void> }>;
> function ScreenRewardDetail(p: DetailProps) {
>   const r = p.selectedReward!;
>   const canRedeem = Number(p.currentUser.points || 0) >= r.cost;
>   return (
>     <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
>       <div className="w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 duration-300">
>         <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
>           <div className="text-[8rem]">{r.icon}</div>
>           <button type="button" onClick={p.onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-border flex items-center justify-center"><X className="w-5 h-5 text-foreground" /></button>
>           {r.seasonal && <div className="absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">⭐ Limited Seasonal</div>}
>         </div>
>         <div className="p-6 space-y-4 overflow-y-auto">
>           <div className="flex items-start justify-between gap-3">
>             <div>
>               <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{r.category}</p>
>               <h2 className="text-2xl font-black text-foreground mt-1 leading-tight">{r.name}</h2>
>             </div>
>             <span className="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary text-white font-black">{r.cost} pts</span>
>           </div>
>           <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
>           <div className="grid grid-cols-3 gap-2 text-center">
>             {[
>               { l: "Stock", v: r.stock }, { l: "Delivery", v: r.delivery }, { l: "Validity", v: r.validity },
>             ].map(s => (
>               <div key={s.l} className="rounded-xl border border-border bg-white p-3">
>                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.l}</p>
>                 <p className="text-xs font-black text-foreground mt-1">{s.v}</p>
>               </div>
>             ))}
>           </div>
>           <div className={`rounded-2xl p-4 flex items-center gap-3 ${canRedeem ? BADGE_OK_BG : BADGE_DANGER_BG}`}>
>             <Wallet className={`w-5 h-5 ${canRedeem ? "text-green-700" : "text-red-700"}`} />
>             <div>
>               <p className="text-xs font-black">{canRedeem ? "✅ You have enough points" : "⚠️ Need more points"}</p>
>               <p className="text-[10px] font-semibold mt-0.5">{canRedeem ? `Balance after redeem: ${(Number(p.currentUser.points || 0) - r.cost).toLocaleString()} pts` : `Short by ${(r.cost - Number(p.currentUser.points || 0)).toLocaleString()} pts — submit more recycling!`}</p>
>             </div>
>           </div>
>           <div className="grid grid-cols-2 gap-3 pt-2">
>             <button type="button" onClick={p.onClose} className={`py-4 ${BTN_SECONDARY_CLS} text-base`}>Close</button>
>             <button type="button" disabled={!canRedeem} onClick={p.onRedeem} className={`py-4 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60`}>Redeem Now</button>
>           </div>
>         </div>
>       </div>
>     </div>
>   );
> }
> 
> function getTaskTypeBadgeClass(type: string): string {
>   if (type === "daily") return "bg-blue-100 text-blue-700";
>   if (type === "weekly") return "bg-purple-100 text-purple-700";
>   return "bg-amber-100 text-amber-700";
> }
> 
> function ScreenTasks(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <h2 className="text-xl font-black text-foreground flex-1">Daily Tasks</h2>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
>         <div className="rounded-2xl p-4 border border-border bg-white">
>           <div className="flex items-center justify-between mb-2">
>             <p className="text-sm font-black text-foreground">Daily progress</p>
>             <p className="text-xs font-black text-primary">3 of 5</p>
>           </div>
>           <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: "60%" }} /></div>
>           <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Complete 5 tasks to unlock <strong>+100 bonus pts</strong></p>
>         </div>
>         {[
>           { t: "Submit 1kg of recyclables", pts: "+50 pts", type: "daily", p: "daily", d: true },
>           { t: "Use app 3 days in a row", pts: "+25 pts", type: "daily", p: "daily", d: true },
>           { t: "Invite 1 neighbor", pts: "+100 pts", type: "daily", p: "daily", d: false },
>           { t: "Attend barangay event", pts: "+200 pts", type: "weekly", p: "weekly", d: false },
>           { t: "Redeem 1 reward", pts: "+75 pts", type: "monthly", p: "monthly", d: false },
>         ].map((t, i) => (
>           <div key={t.t} className="rounded-2xl border border-border bg-white p-4 flex items-center gap-4">
>             <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.d ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"}`}>{t.d ? <CheckSquare2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}</div>
>             <div className="flex-1 min-w-0">
>               <p className="text-sm font-black text-foreground">{t.t}</p>
>               <div className="flex items-center gap-1.5 mt-1">
>                 <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${getTaskTypeBadgeClass(t.type)}`}>{t.p}</span>
>                 <span className="text-xs font-black text-primary">{t.pts}</span>
>               </div>
>             </div>
>             <button type="button" disabled={t.d} className={`px-3 py-1.5 rounded-xl text-xs font-black ${t.d ? "bg-green-500 text-white cursor-default" : [BTN_PRIMARY_CLS, "px-3 py-1.5 text-xs"].join(" ")}`}>{t.d ? "Done" : "Start"}</button>
>           </div>
>         ))}
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenLeaderboard(p: MobileAppRouterProps) {
>   const [viewMode, setViewMode] = useState<"top" | "all">("top");
>   const myUserInLeaderboard = p.mergedLeaderboard.find((u: any) => u._isYou || u.isMe) || {
>     rank: p.profileRank || "#-",
>     displayName: p.currentUser.name || "You",
>     points: p.currentUser.points || 0,
>     barangay: p.currentUser.barangay || "Cabantian",
>     _initials: p.currentUser.initials || "U",
>   };
> 
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 bg-background border-b border-border" style={{ paddingTop: "calc(0.5rem + var(--sat))" }}>
>         <div className="px-5 py-3 flex items-center justify-between">
>           <div>
>             <h2 className="text-xl font-black text-foreground">🏆 Community Leaderboard</h2>
>             <p className="text-xs text-muted-foreground mt-0.5">Top residents &amp; community recyclers in <strong>{p.currentUser.barangay || "Cabantian"}</strong></p>
>           </div>
>           <button
>             type="button"
>             onClick={() => setViewMode(v => v === "top" ? "all" : "top")}
>             className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
>           >
>             {viewMode === "top" ? "Show Full Community" : "Show Top Podium"}
>           </button>
>         </div>
>         <div className="flex border-b border-border px-5">
>           {(["weekly", "monthly"] as const).map(t => (
>             <button type="button" key={t} onClick={() => p.setLeaderTab(t)} className={`px-4 py-2 text-xs font-black capitalize transition-colors relative ${p.leaderTab === t ? "text-primary" : "text-muted-foreground"}`}>
>               {t} Ranking
>               {p.leaderTab === t && <div className="absolute left-3 right-3 -bottom-px h-0.5 bg-primary rounded-full" />}
>             </button>
>           ))}
>         </div>
>       </div>
> 
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32">
>         {/* Pinned Your Standing Card */}
>         <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
>           <div className="flex items-center gap-3">
>             <div className="w-11 h-11 rounded-full bg-white text-green-800 font-black flex items-center justify-center text-sm shadow-xs border-2 border-green-200">
>               {myUserInLeaderboard._initials}
>             </div>
>             <div>
>               <p className="text-[10px] font-bold uppercase tracking-wider text-green-200">Your Current Standing</p>
>               <p className="text-sm font-black text-white">{myUserInLeaderboard.displayName} (You)</p>
>               <p className="text-[11px] text-green-200">{myUserInLeaderboard.barangay || "Cabantian"} · Level {Math.floor(Number(myUserInLeaderboard.points || 0) / 500) + 1}</p>
>             </div>
>           </div>
>           <div className="text-right">
>             <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-black">Rank #{myUserInLeaderboard.rank}</span>
>             <p className="text-base font-black text-green-100 mt-1">{Number(myUserInLeaderboard.points || 0).toLocaleString()} pts</p>
>           </div>
>         </div>
> 
>         {/* Top 3 Podium (when in Top mode) */}
>         {viewMode === "top" && p.mergedLeaderboard.length >= 3 && (
>           <div className="space-y-3">
>             <div className="flex items-center justify-between">
>               <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Top Residents</p>
>               <span className="text-[10px] font-bold text-primary">🥇 Podium Highlights</span>
>             </div>
>             <div className="grid grid-cols-3 gap-2 items-end">
>               {[
>                 { r: 2, u: p.mergedLeaderboard[1], c: "from-slate-100 to-slate-200 border-slate-300", h: "h-32", pl: "🥈" },
>                 { r: 1, u: p.mergedLeaderboard[0], c: "from-amber-100 to-amber-200 border-amber-300", h: "h-40", pl: "🏆" },
>                 { r: 3, u: p.mergedLeaderboard[2], c: "from-orange-100 to-orange-200 border-orange-300", h: "h-28", pl: "🥉" },
>               ].map(pod => (
>                 <div key={pod.r} className={`rounded-2xl border bg-gradient-to-b ${pod.c} p-3 flex flex-col items-center justify-end ${pod.h} relative shadow-xs`}>
>                   {pod.u && (
>                     <>
>                       <div className="absolute -top-4 text-3xl">{pod.pl}</div>
>                       <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-black text-sm border-2 border-white shadow-sm mb-1.5">{pod.u._initials}</div>
>                       <p className="text-xs font-black text-foreground text-center truncate w-full">{pod.u._isYou ? `${pod.u.displayName} (You)` : pod.u.displayName}</p>
>                       <p className="text-[10px] font-black text-primary mt-0.5">{Number(pod.u.points || 0).toLocaleString()} pts</p>
>                     </>
>                   )}
>                 </div>
>               ))}
>             </div>
>           </div>
>         )}
> 
>         {/* Full Community List */}
>         <div className="space-y-2">
>           <div className="flex items-center justify-between">
>             <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Community Rankings</p>
>             <span className="text-[10px] text-muted-foreground font-semibold">{p.mergedLeaderboard.length} Residents</span>
>           </div>
> 
>           <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-xs">
>             {p.mergedLeaderboard.map((u: any, i: number) => {
>               const isYou = u._isYou || u.isMe;
>               return (
>                 <div
>                   key={u.id || u.userId || `leader-${i}`}
>                   className={`flex items-center gap-3 px-4 py-3 transition-colors ${i !== p.mergedLeaderboard.length - 1 ? "border-b border-border" : ""
>                     } ${isYou ? "bg-green-50/80 ring-1 ring-inset ring-green-200" : ""}`}
>                 >
>                   <RankIcon rank={u.rank || i + 1} />
>                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-sm ${isYou ? "bg-primary text-white ring-2 ring-primary/30" : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"}`}>
>                     {u._initials}
>                   </div>
>                   <div className="flex-1 min-w-0">
>                     <div className="flex items-center gap-1.5">
>                       <p className="text-sm font-black text-foreground truncate">{u.displayName}</p>
>                       {isYou && <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded-full">YOU</span>}
>                     </div>
>                     <p className="text-[10px] text-muted-foreground font-semibold">{u.barangay || "Cabantian"} · Level {Math.floor(Number(u.points || 0) / 500) + 1}</p>
>                   </div>
>                   <div className="text-right">
>                     <p className="text-sm font-black text-primary">{Number(u.points || 0).toLocaleString()} pts</p>
>                     <p className="text-[10px] text-muted-foreground">{(u.totalKg || 0).toFixed(1)} kg</p>
>                   </div>
>                 </div>
>               );
>             })}
>           </div>
>         </div>
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenNotifications(p: MobileAppRouterProps) {
>   const items = p.notifItems.length > 0 ? p.notifItems : [
>     { title: "+23 Points Earned", desc: "You recycled 2.3 kg at Kiosk 01", time: "2h ago", i: "🎁", c: "bg-green-50 border-green-200", unread: true },
>     { title: "New Weekly Task", desc: "Submit 1kg to unlock bonus 50 points", time: "8h ago", i: "📋", c: "bg-blue-50 border-blue-200", unread: true },
>     { title: "Seasonal Reward: Christmas Grocery", desc: "Now available in the catalog!", time: "1d ago", i: "🎄", c: "bg-red-50 border-red-200", unread: false },
>     { title: "Welcome to Waste2Goods!", desc: "+50 bonus points for completing onboarding", time: "3d ago", i: "🎉", c: "bg-amber-50 border-amber-200", unread: false },
>   ];
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <h2 className="text-xl font-black text-foreground">Notifications</h2>
>         <p className="text-xs font-bold text-muted-foreground">{p.notifUnread || 0} unread</p>
>       </div>
>       <div className="p-5 space-y-3 overflow-y-auto flex-1 pb-32">
>         {items.map((n: any) => (
>           <div key={String(n.id ?? n.title)} className={`rounded-2xl p-4 flex items-start gap-4 border ${n.c}`}>
>             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl flex-shrink-0 border border-white shadow-sm">{n.i}</div>
>             <div className="flex-1 min-w-0">
>               <div className="flex items-start justify-between gap-2">
>                 <p className="text-sm font-black text-foreground">{n.title}</p>
>                 {n.unread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
>               </div>
>               <p className="text-xs text-foreground/80 mt-0.5">{n.desc}</p>
>               <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold">{n.time}</p>
>             </div>
>           </div>
>         ))}
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenProfile(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="relative overflow-hidden" style={{ paddingTop: "calc(0.5rem + var(--sat))", background: "linear-gradient(135deg, #166534 0%, #14532d 50%, #0c4a6e 100%)" }}>
>         <div className="absolute inset-0 opacity-20">
>           <div className="absolute -right-20 top-0 w-64 h-64 rounded-full bg-white/20" />
>           <div className="absolute -left-10 -bottom-20 w-80 h-80 rounded-full bg-green-400/20" />
>         </div>
>         <div className="relative px-5 py-4 flex items-center justify-between z-10">
>           <h2 className="text-lg font-black text-white">My Profile</h2>
>           <div className="flex gap-2">
>             <button type="button" onClick={() => p.go("settings")} className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white"><Settings className="w-4 h-4" /></button>
>             <button type="button" onClick={() => { Waste2GoodsAPI.logout(); p.go("login"); }} className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white" title="Sign out"><LogOut className="w-4 h-4" /></button>
>           </div>
>         </div>
>         <div className="relative z-10 px-5 pb-8 flex items-end gap-4">
>           <div className="relative">
>             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur flex items-center justify-center border-2 border-white/30">
>               <span className="text-white text-2xl font-black">{p.currentUser.initials}</span>
>             </div>
>             <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-white flex items-center justify-center"><Camera className="w-3.5 h-3.5 text-white" /></div>
>           </div>
>           <div className="flex-1 pb-1 min-w-0">
>             <p className="text-lg font-black text-white truncate">{p.currentUser.name || "Guest User"}</p>
>             <p className="text-xs text-green-200 font-semibold mt-0.5">Level {p.currentUser.level || 1} Recycler · {p.profileRank}</p>
>             <div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-green-100">{p.profileSinceLabel}</span></div>
>           </div>
>         </div>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-32 -mt-4">
>         <div className="rounded-3xl bg-white border border-border p-4 -mt-4 relative shadow-sm">
>           <div className="grid grid-cols-4 gap-2 text-center">
>             {[
>               { l: "Points", v: Number(p.currentUser.points || 0).toLocaleString(), c: "text-primary" },
>               { l: "Recycled", v: `${(p.currentUser.totalKg || 0).toFixed(1)}kg`, c: "text-emerald-600" },
>               { l: "Streak", v: `${p.currentUser.streak || 0}d`, c: "text-orange-600" },
>               { l: "Badges", v: `${p.currentUser.badges || 0}`, c: "text-blue-600" },
>             ].map(s => (
>               <div key={s.l} className="flex flex-col items-center gap-0.5 py-2">
>                 <p className={`text-lg font-black ${s.c} leading-none`}>{s.v}</p>
>                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{s.l}</p>
>               </div>
>             ))}
>           </div>
>         </div>
>         <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
>           <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Recent activity</p>
>           {[
>             { t: "Recycled PET bottles", v: "+8 pts", sub: "K-01 · 2h ago", i: "🧴", c: "bg-blue-50" },
>             { t: "Redeemed: P50 Load", v: "-500 pts", sub: "Today · 9:12 AM", i: "📱", c: "bg-purple-50" },
>             { t: "Daily streak", v: "+25 pts", sub: "3 days in a row!", i: "🔥", c: "bg-orange-50" },
>             { t: "Level 2 Milestone", v: "+100 pts", sub: "2 days ago", i: "⭐", c: "bg-amber-50" },
>           ].map(a => (
>             <div key={a.t} className={`rounded-xl p-3 flex items-center gap-3 ${a.c}`}>
>               <div className="text-2xl">{a.i}</div>
>               <div className="flex-1 min-w-0">
>                 <p className="text-sm font-black text-foreground truncate">{a.t}</p>
>                 <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{a.sub}</p>
>               </div>
>               <span className={`text-xs font-black ${a.v.startsWith("-") ? "text-red-500" : "text-primary"}`}>{a.v}</span>
>             </div>
>           ))}
>         </div>
>         <div className="space-y-2">
>           <button type="button" onClick={() => p.go("history")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
>             <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><Recycle className="w-4 h-4 text-primary" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Recycling History</p><p className="text-[10px] text-muted-foreground font-semibold">All submitted items</p></div></div>
>             <ChevronRight className="w-4 h-4 text-muted-foreground" />
>           </button>
>           <button type="button" onClick={() => p.go("redeem-history")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
>             <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></div><div className="text-left"><p className="text-sm font-black text-foreground">My Redemptions</p><p className="text-[10px] text-muted-foreground font-semibold">Redeemed rewards & delivery</p></div></div>
>             <ChevronRight className="w-4 h-4 text-muted-foreground" />
>           </button>
>           <button type="button" onClick={() => p.go("tasks")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
>             <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><CheckSquare2 className="w-4 h-4 text-blue-600" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Achievements</p><p className="text-[10px] text-muted-foreground font-semibold">Milestones & badges</p></div></div>
>             <ChevronRight className="w-4 h-4 text-muted-foreground" />
>           </button>
>           <button type="button" onClick={() => p.go("settings")} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-border hover:border-primary transition-colors">
>             <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"><Settings className="w-4 h-4 text-muted-foreground" /></div><div className="text-left"><p className="text-sm font-black text-foreground">Settings</p><p className="text-[10px] text-muted-foreground font-semibold">Account, security</p></div></div>
>             <ChevronRight className="w-4 h-4 text-muted-foreground" />
>           </button>
>         </div>
>       </div>
>       <MobileBottomNav screen={p.screen} go={p.go} />
>     </div>
>   );
> }
> 
> function ScreenSettings(p: MobileAppRouterProps) {
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <h2 className="text-xl font-black text-foreground flex-1">Settings</h2>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-16">
>         {p.profileBanner && (
>           <div className={`rounded-xl px-4 py-3 text-sm font-bold ${p.profileBanner.type === "ok" ? BADGE_OK_BG : BADGE_DANGER_BG}`}>{p.profileBanner.text}</div>
>         )}
>         <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
>           <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Edit profile</p>
>           <div className="grid grid-cols-2 gap-3">
>             <Field label="First Name" placeholder="Maria" icon={<User className="w-4 h-4" />} value={p.setFName} onChange={p.setSetFName} />
>             <Field label="Last Name" placeholder="Santos" icon={<User className="w-4 h-4" />} value={p.setLName} onChange={p.setSetLName} />
>           </div>
>           <Field label="Email" placeholder="maria@email.com" icon={<Mail className="w-4 h-4" />} value={p.setFormEmail} onChange={p.setSetFormEmail} />
>           <Field label="Phone Number" placeholder="+63 912 345 6789" icon={<Phone className="w-4 h-4" />} value={p.setPhone} onChange={p.setSetPhone} />
>           <div className="grid grid-cols-3 gap-3">
>             <Field label="Province" placeholder="Metro Manila" icon={<MapPin className="w-4 h-4" />} value={p.setProvince} onChange={p.setSetProvince} />
>             <Field label="City" placeholder="Quezon City" icon={<MapPin className="w-4 h-4" />} value={p.setCity} onChange={p.setSetCity} />
>             <Field label="Barangay" placeholder="Commonwealth" icon={<MapPin className="w-4 h-4" />} value={p.setBrgy} onChange={p.setSetBrgy} />
>           </div>
>           <button type="button" onClick={p.handleSaveProfile} disabled={p.profileSaving} className={`w-full py-4 ${BTN_PRIMARY_CLS} text-base disabled:opacity-60`}>
>             {p.profileSaving ? "Saving..." : "💾 Save Changes"}
>           </button>
>         </div>
>         {isServerIpPanelEnabled() && (
>           <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
>             <div className="flex items-center justify-between">
>               <div>
>                 <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Backend Server IP</p>
>                 <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">XAMPP LAN IP where Waste2Goods backend runs. Mobile app expects raw IP (no http:// or port).</p>
>               </div>
>               <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Globe className="w-4 h-4 text-blue-600" /></div>
>             </div>
>             <ServerIpPanel apiHost={p.apiHost} setApiHost={p.setApiHost} onSaved={() => p.setProfileBanner({ type: "ok", text: "✅ Server IP saved. API requests will use this host." })} />
>           </div>
>         )}
>       </div>
>     </div>
>   );
> }
> 
> function ScreenHistory(p: MobileAppRouterProps) {
>   const items = [
>     { t: "Mixed recyclables", v: "+23 pts", sub: "2.3 kg · K-01 · 2h ago", i: "♻️", c: "bg-green-50", kg: "2.3kg", p: "+23" },
>     { t: "PET Bottles (15x)", v: "+8 pts", sub: "0.8 kg · K-01 · Yesterday", i: "🧴", c: "bg-blue-50", kg: "0.8kg", p: "+8" },
>     { t: "Cardboard boxes", v: "+12 pts", sub: "1.2 kg · K-02 · 2 days ago", i: "📦", c: "bg-amber-50", kg: "1.2kg", p: "+12" },
>     { t: "Aluminum cans (20x)", v: "+3 pts", sub: "0.3 kg · K-01 · 4 days ago", i: "🥫", c: "bg-emerald-50", kg: "0.3kg", p: "+3" },
>     { t: "Mixed paper", v: "+5 pts", sub: "0.5 kg · K-03 · 1 week ago", i: "📄", c: "bg-purple-50", kg: "0.5kg", p: "+5" },
>   ];
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <h2 className="text-xl font-black text-foreground flex-1">Recycling History</h2>
>       </div>
>       <div className="p-5 space-y-4 overflow-y-auto flex-1 pb-20">
>         <div className="grid grid-cols-3 gap-2 text-center">
>           {[
>             { l: "Total", v: `${(Number(p.currentUser.totalKg || 0) + 5.1).toFixed(1)} kg`, c: "from-primary to-emerald-600" },
>             { l: "Submissions", v: `${items.length}`, c: "from-blue-500 to-cyan-600" },
>             { l: "Points earned", v: `+51`, c: "from-amber-500 to-orange-600" },
>           ].map(s => (
>             <div key={s.l} className={`rounded-2xl p-3 bg-gradient-to-br ${s.c} text-white`}>
>               <p className="text-xs font-bold opacity-80">{s.l}</p>
>               <p className="text-xl font-black mt-0.5">{s.v}</p>
>             </div>
>           ))}
>         </div>
>         <div className="rounded-2xl border border-border bg-white overflow-hidden">
>           {items.map((a, i) => (
>             <div key={a.t} className={`flex items-center gap-3 px-4 py-3 ${i !== items.length - 1 ? "border-b border-border" : ""}`}>
>               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${a.c}`}>{a.i}</div>
>               <div className="flex-1 min-w-0">
>                 <p className="text-sm font-black text-foreground">{a.t}</p>
>                 <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{a.sub}</p>
>               </div>
>               <div className="text-right">
>                 <p className="text-xs font-black text-primary">{a.v}</p>
>                 <p className="text-[10px] text-muted-foreground font-semibold">{a.kg}</p>
>               </div>
>             </div>
>           ))}
>         </div>
>       </div>
>     </div>
>   );
> }
> 
> function ScreenRedeemHistory(p: MobileAppRouterProps) {
>   const [items, setItems] = useState([
>     {
>       id: "RD-101",
>       n: "P50 GCash Load",
>       pts: "500 pts",
>       i: "📱",
>       status: "ready",
>       t: "Arrives in 24 hours",
>       code: "GC-2G-9841",
>       pickupLocation: "GCash Digital Distribution",
>       pickupHours: "Processed within 24 Hours",
>       instructions: "Credits will be transferred to your registered mobile number automatically upon verification.",
>       date: "Aug 26, 2026"
>     },
>     {
>       id: "RD-102",
>       n: "5kg Rice Voucher",
>       pts: "1,200 pts",
>       i: "🍚",
>       status: "claimed",
>       t: "Redeemed at K-01",
>       code: "RICE-88-1204",
>       pickupLocation: "Cabantian Barangay Hall (Resource Desk)",
>       pickupHours: "Mon-Fri: 8:00 AM – 5:00 PM",
>       instructions: "Present this voucher code to the desk officer to collect your 5kg Premium Rice pack.",
>       date: "Aug 20, 2026"
>     },
>     {
>       id: "RD-103",
>       n: "School Supplies Kit",
>       pts: "800 pts",
>       i: "🎒",
>       status: "ready",
>       t: "Pick up at Barangay Hall",
>       code: "EDU-44-5920",
>       pickupLocation: "Cabantian Barangay Hall (Ecology Desk)",
>       pickupHours: "Mon-Fri: 8:00 AM – 5:00 PM",
>       instructions: "Present your Claim Code or Resident ID (Maria Santos) at the barangay hall to claim your kit.",
>       date: "Aug 25, 2026"
>     },
>   ]);
> 
>   const [selectedClaim, setSelectedClaim] = useState<any>(null);
>   const [copied, setCopied] = useState(false);
> 
>   const copyCode = (code: string) => {
>     navigator.clipboard.writeText(code);
>     setCopied(true);
>     setTimeout(() => setCopied(false), 2000);
>   };
> 
>   const markAsClaimed = (id: string) => {
>     setItems(prev => prev.map(item => item.id === id ? { ...item, status: "claimed" } : item));
>     if (selectedClaim?.id === id) {
>       setSelectedClaim((prev: any) => prev ? { ...prev, status: "claimed" } : null);
>     }
>   };
> 
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto relative">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <button type="button" onClick={() => p.go("profile")}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <h2 className="text-xl font-black text-foreground flex-1">My Redemptions</h2>
>       </div>
>       <div className="p-5 space-y-3 overflow-y-auto flex-1 pb-20">
>         <p className="text-xs text-muted-foreground font-semibold">Tap on any item to view claim details, pickup instructions, and voucher codes.</p>
>         {items.map(h => {
>           const isReady = h.status === "ready";
>           return (
>             <button
>               key={h.id}
>               type="button"
>               onClick={() => setSelectedClaim(h)}
>               className={`w-full text-left rounded-2xl border transition-all p-4 flex items-start gap-4 ${isReady
>                 ? "bg-white border-green-300 hover:border-primary hover:shadow-md cursor-pointer ring-1 ring-green-100"
>                 : "bg-white/80 border-border hover:border-muted-foreground/40 cursor-pointer"
>                 }`}
>             >
>               <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-3xl flex-shrink-0">{h.i}</div>
>               <div className="flex-1 min-w-0">
>                 <div className="flex items-center gap-2">
>                   <p className="text-sm font-black text-foreground">{h.n}</p>
>                   {isReady && <span className="text-[10px] bg-green-50 text-green-700 font-black px-1.5 py-0.5 rounded border border-green-200">Tap to view</span>}
>                 </div>
>                 <p className="text-xs text-muted-foreground mt-0.5">{h.t} · <span className="font-mono font-bold text-foreground">{h.code}</span></p>
>                 <p className="text-xs font-black text-primary mt-0.5">{h.pts} spent</p>
>               </div>
>               <div className="flex flex-col items-end gap-1">
>                 <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isReady ? "bg-green-100 text-green-700 font-black" : "bg-muted text-muted-foreground"}`}>
>                   {isReady ? "Ready to pick up" : "Claimed"}
>                 </span>
>                 <ChevronRight className="w-4 h-4 text-muted-foreground" />
>               </div>
>             </button>
>           );
>         })}
>       </div>
> 
>       {/* Interactive Claim Details Modal */}
>       {selectedClaim && (
>         <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
>           <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
>             {/* Header */}
>             <div className="flex items-center justify-between pb-3 border-b border-border">
>               <div className="flex items-center gap-3">
>                 <span className="text-4xl">{selectedClaim.i}</span>
>                 <div>
>                   <h3 className="font-black text-lg text-foreground leading-tight">{selectedClaim.n}</h3>
>                   <p className="text-xs text-muted-foreground">Redeemed on {selectedClaim.date} • {selectedClaim.pts}</p>
>                 </div>
>               </div>
>               <button
>                 type="button"
>                 onClick={() => setSelectedClaim(null)}
>                 className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
>               >
>                 <X className="w-4 h-4" />
>               </button>
>             </div>
> 
>             {/* Status Progress Stepper */}
>             <div className="p-4 rounded-2xl bg-muted/40 border border-border">
>               <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wide mb-3">Redemption Progress</p>
>               <div className="flex items-center justify-between relative px-2">
>                 <div className="flex flex-col items-center gap-1 z-10">
>                   <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold"><Check className="w-4 h-4" /></div>
>                   <span className="text-[10px] font-bold text-foreground">Redeemed</span>
>                 </div>
>                 <div className={`h-1 flex-1 ${selectedClaim.status === "claimed" || selectedClaim.status === "ready" ? "bg-green-500" : "bg-border"} -mx-2 mb-4`} />
>                 <div className="flex flex-col items-center gap-1 z-10">
>                   <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedClaim.status === "claimed" ? "bg-green-500 text-white" : "bg-primary text-white ring-4 ring-primary/20"}`}>
>                     {selectedClaim.status === "claimed" ? <Check className="w-4 h-4" /> : <Package className="w-4 h-4" />}
>                   </div>
>                   <span className="text-[10px] font-bold text-foreground">Ready to Pick</span>
>                 </div>
>                 <div className={`h-1 flex-1 ${selectedClaim.status === "claimed" ? "bg-green-500" : "bg-border"} -mx-2 mb-4`} />
>                 <div className="flex flex-col items-center gap-1 z-10">
>                   <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedClaim.status === "claimed" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
>                     {selectedClaim.status === "claimed" ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
>                   </div>
>                   <span className="text-[10px] font-bold text-muted-foreground">Claimed</span>
>                 </div>
>               </div>
>             </div>
> 
>             {/* Claim Code Box */}
>             <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 flex items-center justify-between">
>               <div>
>                 <p className="text-[11px] font-black text-green-800 uppercase tracking-wide">Claim / Voucher Code</p>
>                 <p className="text-xl font-mono font-black text-green-900 tracking-wider mt-0.5">{selectedClaim.code}</p>
>               </div>
>               <button
>                 type="button"
>                 onClick={() => copyCode(selectedClaim.code)}
>                 className="px-3.5 py-2 rounded-xl bg-white border border-green-300 text-green-800 text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-green-50 transition-all"
>               >
>                 {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-green-700" />}
>                 {copied ? "Copied!" : "Copy"}
>               </button>
>             </div>
> 
>             {/* Pickup Location & Hours */}
>             <div className="p-4 rounded-2xl border border-border bg-white space-y-2">
>               <div className="flex items-start gap-2.5">
>                 <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
>                 <div>
>                   <p className="text-xs font-black text-foreground">Pickup Location</p>
>                   <p className="text-xs text-muted-foreground mt-0.5">{selectedClaim.pickupLocation}</p>
>                 </div>
>               </div>
>               <div className="flex items-start gap-2.5 pt-2 border-t border-border">
>                 <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
>                 <div>
>                   <p className="text-xs font-black text-foreground">Operating Schedule</p>
>                   <p className="text-xs text-muted-foreground mt-0.5">{selectedClaim.pickupHours}</p>
>                 </div>
>               </div>
>             </div>
> 
>             {/* Step-by-Step Claim Instructions */}
>             <div className="p-4 rounded-2xl bg-muted/20 border border-border">
>               <p className="text-xs font-black text-foreground mb-2">How to Claim Your Reward</p>
>               <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
>                 <li>Visit the pickup location during official hours.</li>
>                 <li>Present your <strong>Claim Code</strong> or Resident ID to the desk officer.</li>
>                 <li>Verify your item and receive your reward package.</li>
>               </ul>
>             </div>
> 
>             {/* Action Buttons */}
>             <div className="flex gap-2 pt-2">
>               {selectedClaim.status === "ready" ? (
>                 <button
>                   type="button"
>                   onClick={() => markAsClaimed(selectedClaim.id)}
>                   className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
>                 >
>                   <CheckCircle2 className="w-4 h-4" />
>                   Mark as Claimed (Simulate)
>                 </button>
>               ) : (
>                 <div className="flex-1 py-3 rounded-xl bg-green-100 text-green-800 text-sm font-bold text-center flex items-center justify-center gap-2">
>                   <Check className="w-4 h-4" /> Reward Successfully Claimed
>                 </div>
>               )}
>               <button
>                 type="button"
>                 onClick={() => setSelectedClaim(null)}
>                 className="px-5 py-3 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
>               >
>                 Close
>               </button>
>             </div>
>           </div>
>         </div>
>       )}
>     </div>
>   );
> }
> 
> type RedeemConfirmProps = MobileAppRouterProps & Readonly<{ onRedeem: () => Promise<void>; onClose: () => void }>;
> function ScreenRedeemConfirm(p: RedeemConfirmProps) {
>   const r = p.selectedReward!;
>   const cost = r.cost ?? r.points ?? 0;
>   return (
>     <div className="min-h-[100dvh] flex flex-col max-w-3xl w-full mx-auto bg-white">
>       <div className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 bg-background border-b border-border" style={{ paddingTop: "calc(0.75rem + var(--sat))" }}>
>         <button type="button" onClick={p.onClose}><ArrowLeft className="w-5 h-5 text-foreground" /></button>
>         <h2 className="text-xl font-black text-foreground flex-1">Confirm Redemption</h2>
>       </div>
>       <div className="flex-1 flex flex-col items-center p-6 space-y-5 overflow-y-auto pb-20">
>         <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-primary/20 flex items-center justify-center text-6xl">{r.icon}</div>
>         <div className="text-center">
>           <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Redeeming</p>
>           <h2 className="text-2xl font-black text-foreground mt-1">{r.name}</h2>
>           <p className="text-xs text-muted-foreground mt-2">{r.description ?? "Redeemable with your recycling points."}</p>
>         </div>
>         <div className="w-full max-w-md rounded-2xl border border-border bg-white p-4 flex items-center gap-3">
>           <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Wallet className="w-5 h-5 text-primary" /></div>
>           <div className="flex-1">
>             <p className="text-xs text-muted-foreground font-semibold">Your balance</p>
>             <p className="text-sm font-black text-foreground">{Number(p.currentUser.points || 0).toLocaleString()} pts</p>
>           </div>
>           <div className="text-right">
>             <p className="text-xs text-muted-foreground font-semibold">After</p>
>             <p className="text-sm font-black text-primary">{(Number(p.currentUser.points || 0) - Number(cost)).toLocaleString()} pts</p>
>           </div>
>         </div>
>         <div className="w-full max-w-md grid grid-cols-2 gap-3 pt-2">
>           <button type="button" onClick={p.onClose} className={`py-4 ${BTN_SECONDARY_CLS} text-base`}>Cancel</button>
>           <button type="button" onClick={p.onRedeem} className={`py-4 ${BTN_PRIMARY_CLS} text-base`}>Confirm · {cost} pts</button>
>         </div>
>       </div>
>     </div>
>   );
> }
> 
> export default function App() {
>   const [screen, setScreen] = useState<MobileScreen>("splash");
>   const [leaderTab, setLeaderTab] = useState<"weekly" | "monthly">("weekly");
>   const [regStep, setRegStep] = useState(0);
>   const [selectedReward, setSelectedReward] = useState<typeof rewards[0] | null>(null);
>   const [rewardFilter, setRewardFilter] = useState("All");
>   const [mfaCode, setMfaCode] = useState(["", "", "", "", "", ""]);
>   const [weighing, setWeighing] = useState(false);
>   const [email, setEmail] = useState("");
>   const [password, setPassword] = useState("");
>   const [loginError, setLoginError] = useState("");
>   const [loginLoading, setLoginLoading] = useState(false);
>   // Registration form state
>   const [regFullName, setRegFullName] = useState("");
>   const [regEmail, setRegEmail] = useState("");
>   const [regPassword, setRegPassword] = useState("");
>   const [regConfirmPassword, setRegConfirmPassword] = useState("");
>   const [regPhone, setRegPhone] = useState("");
>   const [regProvince, setRegProvince] = useState("");
>   const [regCity, setRegCity] = useState("");
>   const [regBarangay, setRegBarangay] = useState("");
>   const [regStreetAddress, setRegStreetAddress] = useState("");
>   const [regLoading, setRegLoading] = useState(false);
>   const [regError, setRegError] = useState("");
>   // ── Profile state (refreshed from DB when profile screen opens) ──
>   // Initialize immediately from localStorage so the greeting never shows
>   // "Guest User" flash on a real logged-in session (persistent auth restore).
>   const [profileUser, setProfileUser] = useState<any>(() => {
>     try {
>       const raw = localStorage.getItem("w2g_auth_state");
>       if (!raw) return null;
>       const parsed = JSON.parse(raw);
>       return parsed?.user && (parsed.user.id || parsed.user.userId) ? { ...parsed.user } : null;
>     } catch {
>       return null;
>     }
>   });
>   const [profileRank, setProfileRank] = useState<string>("#-");
>   const [profileSaving, setProfileSaving] = useState(false);
>   const [profileBanner, setProfileBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
>   // Live editable settings form (defaultValue on inputs is broken without controlled state)
>   const [setFName, setSetFName] = useState("");
>   const [setLName, setSetLName] = useState("");
>   const [setFormEmail, setSetFormEmail] = useState("");
>   const [setPhone, setSetPhone] = useState("");
>   const [setBrgy, setSetBrgy] = useState("");
>   const [setCity, setSetCity] = useState("");
>   const [setProvince, setSetProvince] = useState("");
>   // ── Live leaderboard from DB (fallback to DEMO_LEADERBOARD_FALLBACK if API unavailable) ──
>   const [liveLeaderboard, setLiveLeaderboard] = useState<any[] | null>(null);
>   // ── Notifications state (for mobile 🔔 bell) ──
>   const [notifItems, setNotifItems] = useState<any[]>([]);
>   const [notifUnread, setNotifUnread] = useState(0);
>   const [kioskSession, setKioskSession] = useState<{ connected: boolean; kioskId?: string; connectedAt?: number }>({ connected: false });
>   const [kioskChecking, setKioskChecking] = useState(false);
>   const [apiHost, setApiHost] = useState(() => getApiHost());
>   const [showLoginServer, setShowLoginServer] = useState(() => {
>     try {
>       const hasSetIp = localStorage.getItem("w2g_api_host");
>       return !hasSetIp;
>     } catch {
>       return true;
>     }
>   });
>   const [loginServerBanner, setLoginServerBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
>   const weight = useAnimatedWeight(2.3, weighing);
>   const mfaRefs = useRef<(HTMLInputElement | null)[]>([]);
> 
>   const availableCities = regProvince ? Object.keys(PH_LOCATIONS[regProvince] || {}).sort(alphabeticalCompare) : [];
>   const availableBarangays =
>     regProvince && regCity ? (PH_LOCATIONS[regProvince]?.[regCity] || []).sort(alphabeticalCompare) : [];
> 
>   const go = (s: MobileScreen) => setScreen(s);
> 
>   // ── Automatic URL Pathname Sanitizer ──
>   useEffect(() => {
>     try {
>       if (typeof window !== "undefined" && window.location.pathname && window.location.pathname !== "/") {
>         if (window.location.pathname.includes("192.168.") || window.location.pathname.includes("localhost") || window.location.pathname.includes("/api/auth")) {
>           window.history.replaceState({}, document.title, "/");
>         }
>       }
>     } catch { /* ignore */ }
>   }, []);
> 
>   // ── OAuth Callback Query Parameter Handler (Native + Appwrite SDK) ──
>   useEffect(() => {
>     let cancelled = false;
>     (async () => {
>       try {
>         const params = new URLSearchParams(window.location.search);
> 
>         // 0. OAuth failure — the backend redirects here with `oauth_error` instead of
>         //    a dead-end JSON page, so show the real reason on the login screen.
>         const oauthError = params.get("oauth_error");
>         if (oauthError) {
>           window.history.replaceState({}, document.title, window.location.pathname);
>           setLoginError(`Sign-in failed: ${oauthError}`);
>           if (!cancelled) setScreen("login");
>           return;
>         }
> 
>         // 1. Native backend OAuth redirect — tokens come as URL params
>         const token = params.get("token") || params.get("accessToken");
>         if (token) {
>           const userId = params.get("userId") || "U-001";
>           const provider = params.get("provider") || "oauth";
>           const name = params.get("name") || (provider === "github" ? "GitHub User" : "Resident");
>           const email = params.get("email") || "";
>           const role = params.get("role") || "resident";
>           const refreshToken = params.get("refreshToken") || "";
>           const userObj = {
>             id: userId,
>             userId,
>             name,
>             email,
>             role,
>             total_points: 0,
>             pointsBalance: 0,
>             barangayName: "Cabantian",
>           };
>           const authState: any = {
>             token,
>             accessToken: token,
>             refreshToken,
>             isAuthenticated: true,
>             user: userObj,
>           };
>           localStorage.setItem("w2g_auth_state", JSON.stringify(authState));
>           setProfileUser({ ...userObj });
>           window.history.replaceState({}, document.title, window.location.pathname);
>           if (!cancelled) setScreen("home");
>           return;
>         }
> 
>         // 2. Appwrite SDK OAuth redirect — Appwrite saved a session but no URL tokens.
>         //    We detect an active Appwrite account session → create JWT → sync with backend → get platform tokens.
>         Waste2GoodsAPI.appwrite.configure();
>         const me = await Waste2GoodsAPI.appwrite.whoAmI();
>         if (me && !cancelled) {
>           const provider =
>             (typeof (me as any).providerType === "string" && (me as any).providerType) ||
>             (typeof (me as any).provider === "string" && (me as any).provider) ||
>             "appwrite";
>           const synced = await Waste2GoodsAPI.appwrite.syncWithBackend({ provider });
>           if (synced?.token && synced?.user && !cancelled) {
>             setProfileUser({ ...(synced.user as any) });
>             window.history.replaceState({}, document.title, window.location.pathname);
>             setScreen("home");
>           }
>         }
>       } catch (e) {
>         if (!cancelled) console.warn("OAuth callback handler:", e);
>       }
>     })();
>     return () => { cancelled = true; };
>   }, []);
> 
>   useEffect(() => {
>     if (screen === "splash") {
>       // PERSISTENT AUTH: Do NOT logout on every app launch.
>       // Instead check localStorage for a valid saved session — if found,
>       // skip onboarding and jump straight to Home (user stays signed in
>       // until they explicitly tap "Sign Out" on the Profile screen).
>       const t = setTimeout(() => {
>         const existing = Waste2GoodsAPI.getAuthState();
>         if (existing?.isAuthenticated && existing?.token && existing?.user) {
>           go("home");
>         } else {
>           go("onboard1");
>         }
>       }, 1200);
>       return () => clearTimeout(t);
>     }
>   }, [screen]);
> 
>   // AUTH GUARD: If screen is a protected route but no valid auth token, force back to login.
>   // (Prevents stale state or manual state tampering from bypassing sign-in.)
>   useEffect(() => {
>     if (!UNPROTECTED_SCREENS.has(screen)) {
>       const auth = Waste2GoodsAPI.getAuthState();
>       if (!auth?.isAuthenticated || !auth?.token) {
>         console.log("🔐 Mobile auth guard: no valid token — returning to login");
>         Waste2GoodsAPI.logout();
>         setScreen("login");
>       }
>     }
>   }, [screen]);
> 
>   // Helper to get current user's display data — reactive (reads from profileUser state when set)
>   const currentUser = useMemo(() => buildCurrentUser(profileUser), [profileUser]);
> 
>   // Merged leaderboard: prefer live DB rows (with correct user names from MySQL),
>   // otherwise fall back to the demo placeholder list. Always returns a non-empty array
>   // so the Community Leaderboard panel never appears empty.
>   const mergedLeaderboard = useMemo(
>     () => buildMergedLeaderboard(liveLeaderboard || null, currentUser),
>     [liveLeaderboard, currentUser.id, currentUser.userId, currentUser.barangay],
>   );
> 
>   // When user opens Profile, Settings, or History — re-pull their latest DB row
>   // (points, submissions, name) and their current leaderboard rank.
>   // Also seed the editable settings form fields so the "Save Changes" button works.
>   useEffect(() => {
>     if (!["profile", "settings", "history"].includes(screen)) return;
>     let cancelled = false;
>     (async () => {
>       setProfileBanner(null);
>       // Refresh user from GET /users/:id and sync to localStorage
>       const refreshed = Waste2GoodsAPI.refreshCurrentUser ? await Waste2GoodsAPI.refreshCurrentUser() : null;
>       if (cancelled) return;
>       if (refreshed) setProfileUser({ ...refreshed });
>       else {
>         const storedUser = Waste2GoodsAPI.getAuthState()?.user;
>         if (storedUser) setProfileUser({ ...storedUser });
>       }
> 
>       const rankPromise = Waste2GoodsAPI.getCurrentRank ? Waste2GoodsAPI.getCurrentRank() : Promise.resolve("#-");
>       const rank = await rankPromise;
>       if (cancelled) return;
>       setProfileRank(rank || "#-");
>     })();
>     return () => { cancelled = true; };
>   }, [screen]);
> 
>   // Fetch MY notifications (mobile 🔔 bell) when user enters Home or Notifications screen,
>   // or just after login/authenticated screens to keep the red-dot badge accurate.
>   // Also re-fetch whenever notifications screen is about to be entered for freshness.
>   useEffect(() => {
>     const authScreens: MobileScreen[] = ["home", "notifications", "profile", "tasks", "rewards", "submit", "history", "settings", "redeem-history", "redeem-confirm"];
>     if (!authScreens.includes(screen)) return;
>     let cancelled = false;
>     (async () => {
>       if (!Waste2GoodsAPI.getMyNotifications) return;
>       const res = await Waste2GoodsAPI.getMyNotifications();
>       if (cancelled || !res) return;
>       setNotifItems(res.items || []);
>       setNotifUnread(Number(res.unread || 0));
>     })();
>     return () => { cancelled = true; };
>   }, [screen]);
> 
>   // Fetch LIVE leaderboard from real DB on Home + Rewards/Leaderboard views.
>   // Falls back to DEMO_LEADERBOARD_FALLBACK silently if backend unreachable so UI stays clean.
>   useEffect(() => {
>     const watchScreens: MobileScreen[] = ["home", "rewards", "leaderboard"];
>     if (!watchScreens.includes(screen)) return;
>     let cancelled = false;
>     (async () => {
>       try {
>         if (!Waste2GoodsAPI.fetchLeaderboard) return;
>         const rows = await Waste2GoodsAPI.fetchLeaderboard();
>         if (cancelled) return;
>         setLiveLeaderboard(Array.isArray(rows) && rows.length > 0 ? rows : null);
>       } catch (err) {
>         console.warn("Leaderboard fetch failed:", err);
>         if (!cancelled) setLiveLeaderboard(null);
>       }
>     })();
>     return () => { cancelled = true; };
>   }, [screen]);
> 
>   // Poll backend: is this user currently linked to a kiosk?
>   // Also tick every second so the "elapsed" label in the badge refreshes in real-time
>   const [kioskTick, setKioskTick] = useState(0);
>   useEffect(() => {
>     const watchScreens: MobileScreen[] = ["home", "submit", "submit-scan", "submit-confirm", "submit-done", "profile", "settings", "tasks", "rewards"];
>     if (!watchScreens.includes(screen)) return;
>     const uid = currentUser.id || currentUser.userId;
>     if (!uid) return;
>     let cancelled = false;
>     const poll = async () => {
>       if (!Waste2GoodsAPI.getKioskSessionStatus) return;
>       setKioskChecking(true);
>       const res = await Waste2GoodsAPI.getKioskSessionStatus(uid);
>       if (cancelled) return;
>       setKioskChecking(false);
>       if (!res) {
>         setKioskSession({ connected: false });
>         return;
>       }
>       setKioskSession(prev => ({
>         connected: !!res.connected,
>         kioskId: res.kioskId,
>         connectedAt: res.connected
>           ? (res.connectedAt ?? prev.connectedAt ?? Date.now())
>           : undefined,
>       }));
>     };
>     poll();
>     const iv = setInterval(poll, 3000);
>     const tickIv = setInterval(() => setKioskTick(t => t + 1), 1000);
>     return () => { cancelled = true; clearInterval(iv); clearInterval(tickIv); };
>   }, [screen, currentUser.id, currentUser.userId]);
> 
>   // Disconnect current kiosk session (callable from the badge)
>   const handleDisconnectKiosk = async () => {
>     const uid = currentUser.id || currentUser.userId;
>     if (!uid) return;
>     try {
>       await Waste2GoodsAPI.disconnectKioskSession?.(uid);
>     } catch { /* ignore */ }
>     setKioskSession({ connected: false });
>     try {
>       localStorage.removeItem("w2g_kiosk_qr_bridge");
>       window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge" }));
>     } catch { /* ignore */ }
>   };
> 
>   // Live "time since kiosk link" label for the kiosk badge. Recomputed on every second-tick
>   // (kioskTick) so the elapsed text stays current without restarting the polling interval.
>   const kioskElapsedLabel = useMemo(
>     () => elapsedFromTs(kioskSession.connectedAt),
>     [kioskSession.connectedAt, kioskTick],
>   );
>   // Seed the settings form inputs from currentUser whenever the screen opens
>   useEffect(() => {
>     if (screen !== "settings") return;
>     // Split name → first/last for editable fields (else leave blank)
>     const parts = (currentUser.name || "").trim().split(/\s+/);
>     const first = currentUser.firstName || parts[0] || "";
>     const last = currentUser.lastName || parts.slice(1).join(" ") || "";
>     setSetFName(first);
>     setSetLName(last);
>     setSetFormEmail(currentUser.email || "");
>     setSetPhone(currentUser.phone || "");
>     setSetBrgy(currentUser.barangay || "");
>     setSetCity(currentUser.city || "");
>     setSetProvince(currentUser.province || "");
>     setProfileBanner(null);
>     setApiHost(getApiHost());
>   }, [screen, currentUser.id]);
> 
>   // Build the "Since Month Year" string from the user's actual createdAt row
>   const profileSinceLabel = (() => {
>     if (currentUser.joined) return `Since ${currentUser.joined}`;
>     if (currentUser.createdAt) {
>       try {
>         return `Since ${new Date(currentUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
>       } catch { /* ignore */ }
>     }
>     return "Since Today";
>   })();
> 
>   // Build profile update patches from current form state — extracted to keep
>   // handleSaveProfile below the 15-point cognitive complexity ceiling (S3776).
>   const buildProfilePatches = (): Record<string, any> => {
>     const patches: Record<string, any> = {};
>     if (setFName) patches.firstName = setFName;
>     if (setLName) patches.lastName = setLName;
>     if (setFormEmail) patches.email = setFormEmail;
>     if (setPhone) patches.phone = setPhone;
>     if (setProvince) patches.province = setProvince;
>     if (setCity) patches.city = setCity;
>     if (setBrgy) patches.barangayName = setBrgy;
>     return patches;
>   };
> 
>   // Perform the profile save HTTP call — supports both Waste2GoodsAPI.saveProfile
>   // helper and a raw fetch fallback — extracted to keep handleSaveProfile simple.
>   const saveProfileViaApiCall = async (patches: Record<string, any>): Promise<boolean> => {
>     if (Waste2GoodsAPI.saveProfile) {
>       return Waste2GoodsAPI.saveProfile(patches);
>     }
>     const userId = currentUser.id || currentUser.userId;
>     const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
>       method: "PUT",
>       headers: { "Content-Type": "application/json", Authorization: `Bearer ${Waste2GoodsAPI.getAuthState()?.token || ""}` },
>       body: JSON.stringify(patches),
>     });
>     return res.ok;
>   };
> 
>   // Handler for the Settings "Save Changes" button — PUTs to /users/:id via core helper
>   const handleSaveProfile = async () => {
>     setProfileSaving(true);
>     setProfileBanner(null);
>     try {
>       const patches = buildProfilePatches();
>       const ok = await saveProfileViaApiCall(patches);
>       if (ok) {
>         const fresh = Waste2GoodsAPI.refreshCurrentUser ? await Waste2GoodsAPI.refreshCurrentUser() : null;
>         if (fresh) setProfileUser({ ...fresh });
>         setProfileBanner({ type: "ok", text: "✅ Profile saved successfully!" });
>       } else {
>         setProfileBanner({ type: "err", text: "⚠️ Failed to save. Check backend connection." });
>       }
>     } catch (e) {
>       setProfileBanner({ type: "err", text: e instanceof Error ? e.message : "⚠️ Save failed" });
>     } finally {
>       setProfileSaving(false);
>     }
>   };
> 
>   useEffect(() => {
>     if (screen === "submit-scan") {
>       const t = setTimeout(() => go("submit-confirm"), 2200);
>       return () => clearTimeout(t);
>     }
>   }, [screen]);
> 
>   useEffect(() => {
>     if (screen === "submit-confirm") {
>       setWeighing(false);
>       setTimeout(() => setWeighing(true), 300);
>     }
>   }, [screen]);
> 
>   // QR Scanner for mobile
>   useEffect(() => {
>     if (screen === "submit-scan") {
>       // Initialize the scanner
>       const scanner = new Html5QrcodeScanner(
>         "qr-reader",
>         { fps: 10, qrbox: { width: 250, height: 250 } },
>         false
>       );
>       scanner.render(
>         (decodedText) => {
>           console.log("QR code scanned:", decodedText);
>           // Write QR BRIDGE so Kiosk (cross-tab) picks up this logged-in user
>           // This is how the mobile signals the kiosk: "I am [user], connect me"
>           try {
>             const auth = Waste2GoodsAPI.getAuthState();
>             const u = auth?.user || {};
>             const bridgePayload = {
>               user: {
>                 id: (u as any).id || (u as any).userId || currentUser.id || "U-001",
>                 userId: (u as any).id || (u as any).userId || currentUser.id || "U-001",
>                 name: currentUser.name && currentUser.name !== "Guest User" ? currentUser.name : (u as any).name || `${(u as any).firstName || ""} ${(u as any).lastName || ""}`.trim() || "Registered User",
>                 firstName: (u as any).firstName,
>                 lastName: (u as any).lastName,
>                 email: currentUser.email || (u as any).email || "",
>                 points: currentUser.points ?? (u as any).pointsBalance ?? 0,
>                 pointsBalance: currentUser.points ?? (u as any).pointsBalance ?? 0,
>               },
>               kioskPayload: decodedText,
>               timestamp: Date.now(),
>             };
>             localStorage.setItem("w2g_kiosk_qr_bridge", JSON.stringify(bridgePayload));
>             // Also emit cross-tab storage event for same-origin kiosk tabs already listening
>             try { window.dispatchEvent(new StorageEvent("storage", { key: "w2g_kiosk_qr_bridge", newValue: JSON.stringify(bridgePayload) })); } catch { }
>             Waste2GoodsAPI.connectKioskSession?.({
>               userId: bridgePayload.user.id || bridgePayload.user.userId,
>               userName: bridgePayload.user.name,
>               kioskId: decodedText.includes("K-") ? decodedText : "K-01",
>             });
>             console.log("✅ QR bridge written to localStorage (kiosk should pick up user within ~800ms):", bridgePayload.user.name);
>           } catch (bridgeErr) {
>             console.warn("QR bridge write failed:", bridgeErr);
>           }
>           scanner.clear().catch(() => { });
>           go("submit-confirm");
>         },
>         (errorMessage) => {
>           console.log("QR scan error:", errorMessage);
>         }
>       );
>       // Cleanup on unmount
>       return () => {
>         scanner.clear().catch(() => { });
>       };
>     }
>   }, [screen]);
> 
>   const rewardCategories = ["All", "Education", "Grocery", "Lifestyle", "Garden", "Wellness"];
>   const filteredRewards = rewardFilter === "All" ? rewards : rewards.filter(r => r.category === rewardFilter);
> 
> 
>   const onLogin = async () => {
>     setLoginError("");
>     setLoginLoading(true);
>     try {
>       const res = await Waste2GoodsAPI.login(email.trim(), password);
>       if (res?.user) setProfileUser({ ...res.user });
>       go("home");
>     } catch (err: any) {
>       setLoginError(err?.message || "Invalid email or password. Please try again.");
>     } finally {
>       setLoginLoading(false);
>     }
>   };
> 
>   const onRegisterStep1Next = () => {
>     if (validateRegisterStep1({ full: regFullName, email: regEmail, phone: regPhone, pwd: regPassword, confirm: regConfirmPassword }, setRegError)) {
>       setRegStep(1);
>     }
>   };
> 
>   const onRegisterStep2Next = () => {
>     if (validateRegisterAddress({ province: regProvince, city: regCity, barangay: regBarangay }, setRegError)) {
>       setRegStep(2);
>     }
>   };
> 
>   const onRegisterStep3MFA = async () => {
>     await doRegisterSubmit(
>       { full: regFullName, email: regEmail, pwd: regPassword, confirm: regConfirmPassword, phone: regPhone, province: regProvince, city: regCity, barangay: regBarangay, street: regStreetAddress },
>       setRegError,
>       setRegLoading,
>       setProfileUser,
>       setRegStep,
>       go,
>       "mfa"
>     );
>   };
> 
>   const onRegisterStep3Skip = async () => {
>     await doRegisterSubmit(
>       { full: regFullName, email: regEmail, pwd: regPassword, confirm: regConfirmPassword, phone: regPhone, province: regProvince, city: regCity, barangay: regBarangay, street: regStreetAddress },
>       setRegError,
>       setRegLoading,
>       setProfileUser,
>       setRegStep,
>       go,
>       "profile-setup"
>     );
>   };
> 
>   const onToggleLoginServer = () => setShowLoginServer(prev => !prev);
> 
>   const onRewardRedeem = async () => {
>     if (!selectedReward) return;
>     const cost = selectedReward.cost ?? selectedReward.points ?? 0;
>     const newBal = Math.max(0, Number(currentUser.points || 0) - Number(cost));
>     patchAuthBalance(newBal);
>     setProfileUser((prev: any) => ({ ...(prev || currentUser), points: newBal, pointsBalance: newBal, redeemed: Number(currentUser.redeemed || 0) + 1 }));
>     setSelectedReward(null);
>     go("redeem-history");
>   };
> 
>   const onRewardClose = () => setSelectedReward(null);
> 
>   const onSubmitConfirm = () => {
>     const earnedPts = Math.round(Number(weight) * 10);
>     const newBal = Number(currentUser.points || 0) + earnedPts;
>     const newTotalKg = Number(currentUser.totalKg || 0) + Number(weight);
>     patchAuthBalance(newBal);
>     setProfileUser((prev: any) => ({
>       ...(prev || currentUser),
>       points: newBal,
>       pointsBalance: newBal,
>       totalKg: newTotalKg,
>       submissions: Number(currentUser.submissions || 0) + 1,
>     }));
>     go("submit-done");
>   };
>     
> const onClaimed = (r: { newBalance: number; pointsAwarded: number; bottles: number }) => {
>     patchAuthBalance(r.newBalance);
>     setProfileUser((prev: any) => ({
>       ...(prev || currentUser),
>       points: r.newBalance,
>       pointsBalance: r.newBalance,
>       submissions: Number(currentUser.submissions || 0) + 1,
>     }));
>   };
> 
>   return (
>     <div
>       className="flex flex-col w-full bg-background"
>       style={{
>         background: "#f0fdf4",
>         fontFamily: "'Nunito', sans-serif",
>         height: "100dvh",
>       }}
>     >
>       <MobileScreens
>         screen={screen}
>         leaderTab={leaderTab}
>         regStep={regStep}
>         selectedReward={selectedReward}
>         rewardFilter={rewardFilter}
>         mfaCode={mfaCode}
>         weighing={weighing}
>         email={email}
>         password={password}
>         loginError={loginError}
>         loginLoading={loginLoading}
>         regFullName={regFullName}
>         regEmail={regEmail}
>         regPassword={regPassword}
>         regConfirmPassword={regConfirmPassword}
>         regPhone={regPhone}
>         regProvince={regProvince}
>         regCity={regCity}
>         regBarangay={regBarangay}
>         regStreetAddress={regStreetAddress}
>         regLoading={regLoading}
>         regError={regError}
>         profileUser={profileUser}
>         profileRank={profileRank}
>         profileSaving={profileSaving}
>         profileBanner={profileBanner}
>         setFName={setFName}
>         setLName={setLName}
>         setFormEmail={setFormEmail}
>         setPhone={setPhone}
>         setProvince={setProvince}
>         setCity={setCity}
>         setBrgy={setBrgy}
>         showLoginServer={showLoginServer}
>         loginServerBanner={loginServerBanner}
>         apiHost={apiHost}
>         weight={weight}
>         kioskSession={kioskSession}
>         kioskChecking={kioskChecking}
>         kioskElapsedLabel={kioskElapsedLabel}
>         mergedLeaderboard={mergedLeaderboard}
>         currentUser={currentUser}
>         notifItems={notifItems}
>         notifUnread={notifUnread}
>         rewardCategories={rewardCategories}
>         filteredRewards={filteredRewards}
>         profileSinceLabel={profileSinceLabel}
>         availableCities={availableCities}
>         availableBarangays={availableBarangays}
>         mfaRefs={mfaRefs}
>         setLeaderTab={setLeaderTab}
>         setRegStep={setRegStep}
>         setSelectedReward={setSelectedReward}
>         setRewardFilter={setRewardFilter}
>         setMfaCode={setMfaCode}
>         setEmail={setEmail}
>         setPassword={setPassword}
>         setRegFullName={setRegFullName}
>         setRegEmail={setRegEmail}
>         setRegPassword={setRegPassword}
>         setRegConfirmPassword={setRegConfirmPassword}
>         setRegPhone={setRegPhone}
>         setRegProvince={setRegProvince}
>         setRegCity={setRegCity}
>         setRegBarangay={setRegBarangay}
>         setRegStreetAddress={setRegStreetAddress}
>         setRegError={setRegError}
>         setProfileBanner={setProfileBanner}
>         setSetFName={setSetFName}
>         setSetLName={setSetLName}
>         setSetFormEmail={setSetFormEmail}
>         setSetPhone={setSetPhone}
>         setSetProvince={setSetProvince}
>         setSetCity={setSetCity}
>         setSetBrgy={setSetBrgy}
>         setLoginServerBanner={setLoginServerBanner}
>         setApiHost={setApiHost}
>         handleSaveProfile={handleSaveProfile}
>         handleDisconnectKiosk={handleDisconnectKiosk}
>         onLogin={onLogin}
>         onRegisterStep1Next={onRegisterStep1Next}
>         onRegisterStep2Next={onRegisterStep2Next}
>         onRegisterStep3MFA={onRegisterStep3MFA}
>         onRegisterStep3Skip={onRegisterStep3Skip}
>         onToggleLoginServer={onToggleLoginServer}
>         onRewardRedeem={onRewardRedeem}
>         onRewardClose={onRewardClose}
>         onSubmitConfirm={onSubmitConfirm}
>         go={go}
>       />
>     </div>
>   );
> }

can you change it?

# Claude — Nov 20, 2026, 8:49 PM

I checked your file against all six edits. Five are done correctly: the import, the `"redeem-code"` screen type, the prop type, the `case "redeem-code"` line, and the Home button. The `onClaimed` function is also there.

The only thing missing is the `onClaimed={onClaimed}` line inside `<MobileScreens ... />`, which is why the red error is still there. Right now the end of that block looks like this:

```tsx
        onSubmitConfirm={onSubmitConfirm}
        go={go}
      />
```

Change it to this by adding the one new line:

```tsx
        onSubmitConfirm={onSubmitConfirm}
        onClaimed={onClaimed}
        go={go}
      />
```

To find it, press `Ctrl+F` and search for `onSubmitConfirm={onSubmitConfirm}`. It's near the bottom of the file, around line 3220. Put your cursor at the end of that line, press Enter, and type `onClaimed={onClaimed}`.

Optionally, tidy the indentation of the function you pasted. It currently starts at the far left (`const onClaimed = ...`), which works but looks out of place. Select the whole function and press `Shift+Alt+F` to format the file, or indent it by two spaces so it lines up with `const onSubmitConfirm`.

Save the file. The Problems panel should show 0 errors, and then you can test the Redeem Receipt Code screen. For the test, send a new deposit with a fresh `transaction_id` and code to your local server (for example `test-0005` with `TEST6789`), then enter that code in the app.

# Human — Nov 20, 2026, 8:50 PM

next?

# Claude — Nov 20, 2026, 8:50 PM

Next is to test it on your PC, and if it works, deploy it.

**1. Check for errors.** Save all the files. The Problems panel in VS Code should show 0 errors.

**2. Test locally**

1. Start the app the way you usually do (`RUN_GUIDE.md`). The backend should be on `localhost:3001`.
2. Send a fresh test deposit from PowerShell. Use values you haven't used before:
   ```powershell
   $body = @{ transaction_id="test-0005"; machine_id="K-01"; bottles=3; points=15; code="TEST6789" } | ConvertTo-Json
   Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/machine/transactions" -Headers @{ "X-Machine-Key"="test-key-123" } -ContentType "application/json" -Body $body
   ```
   It should print `ok: True` and `pointsAwarded`.
3. In the app, log in as a resident, tap **Redeem Receipt Code** on Home, type `TEST6789` and press **Redeem Points**.
4. You should see the "Points Added!" screen with the new balance.
5. Try the same code again. You should get "This code was already used".
6. Try a made-up code like `ZZZZ9999`. You should get "Invalid code".

**3. Deploy.** Add only the files you changed. Don't use `git add .`, because your `waste2goods.db` file shows as modified and shouldn't be pushed.

```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype"
git add packages/core packages/mobile-app
git status
git commit -m "Add receipt code redeem screen"
git push
```

Check `git status` before committing. It should list `api.ts`, `api.js`, `App.tsx` and the new `ScreenRedeemCode.tsx`, and nothing else.

Then on the droplet:

```bash
ssh root@129.212.239.28
cd /home/deploy/waste2goods
sudo -u deploy git pull
docker compose up -d --build
docker compose logs --tail=30 api
```

The rebuild takes a few minutes, and the site may be briefly down while it restarts.

**4. Test on the live site.** Send a live test deposit with your real key (don't paste the key here), using a new ID and code, for example `live-test-0002` and `LIVE6789`. Then log in at waste2goods.site on your phone and redeem the code. After the test, you can delete the test rows from `machine_deposits` as before.

Tell me what happens at each step, or send any error you see.

# Human — Nov 20, 2026, 8:59 PM

PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype> $body = @{ transaction_id="test-0005"; machine_id="K-01"; bottles=3; points=15; code="TEST6789" } | ConvertTo-Json
>> Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/machine/transactions" -Headers @{ "X-Machine-Key"="test-key-123" } -ContentType "application/json" -Body $body

  ok depositId pointsAwarded
  -- --------- -------------
True test-0005            15

the problem is that i cant test it in local cause i deployed it already unsay buhaton?

# Claude — Nov 20, 2026, 8:59 PM

The deposit worked on your local server (`ok: True`), but the new Redeem screen only exists on your PC right now. The live site `waste2goods.site` still has the old app, because you haven't pushed and rebuilt it since the changes. The earlier deploy only added the machine API. So you can test in either of two ways.

**Option A: Test locally (safer, do this first)**

Your local backend is already running, since the deposit just went through. You only need to start the mobile app:

1. Open a new terminal in `C:\Users\USER\Downloads\Gamified Recycling Platform Prototype`.
2. Run:
   ```powershell
   npm run dev --workspace=@waste2goods/mobile-app
   ```
   If that command doesn't exist, check `RUN_GUIDE.md` or the `scripts` section of `packages/mobile-app/package.json` for the dev command.
3. Open the address it prints, usually `http://localhost:5173`.
4. Log in as a resident, tap **Redeem Receipt Code** and enter `TEST6789`.

Use the local site, not `waste2goods.site`. The `TEST6789` code is only in your local database, so the live site will say "Invalid code".

**Option B: Deploy first, then test on the live site**

If you'd rather skip local testing:

1. Push the code:
   ```powershell
   git add packages/core packages/mobile-app
   git status
   git commit -m "Add receipt code redeem screen"
   git push
   ```
2. Update the droplet:
   ```bash
   cd /home/deploy/waste2goods
   sudo -u deploy git pull
   docker compose up -d --build
   ```
3. Create a live test deposit from the droplet. It reads the key from `.env`, so you don't type it:
   ```bash
   KEY=$(grep '^MACHINE_API_KEY=' .env | cut -d= -f2-)
   curl -s -X POST https://waste2goods.site/api/machine/transactions \
     -H "X-Machine-Key: $KEY" -H "Content-Type: application/json" \
     -d '{"transaction_id":"live-test-0002","machine_id":"K-01","bottles":3,"points":15,"code":"LIVE6789"}'
   ```
4. Log in at waste2goods.site as a resident and redeem `LIVE6789`.

Option A is better because a mistake only affects your own PC. With Option B, the new screen goes live right away, and a bug would be visible to everyone using the site.

Tell me which one you choose and what you see.

# Human — Nov 20, 2026, 9:00 PM

PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype> npm run dev --workspace=@waste2goods/mobile-app

> @waste2goods/mobile-app@0.0.1 dev
> vite

error when starting dev server:
Error: Port 5173 is already in use
    at Server.onError (file:///C:/Users/USER/Downloads/Gamified%20Recycling%20Platform%20Prototype/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:25023:18)
    at Server.emit (node:events:519:28)
    at emitErrorNT (node:net:1940:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
npm error Lifecycle script `dev` failed with error:
npm error code 1
npm error path C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\mobile-app
npm error workspace @waste2goods/mobile-app@0.0.1
npm error location C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\mobile-app
npm error command failed
npm error command C:\WINDOWS\system32\cmd.exe /d /s /c vite
PS C:\Users\USER\Downloads\Gamified Recycling Platform Prototype>

# Claude — Nov 20, 2026, 9:00 PM

That error is probably good news. Port 5173 is already in use, which most likely means your mobile app is already running from earlier. Vite reloads automatically when you save files, so your new changes should already be in it.

**Try this first**

Open `http://localhost:5173` in your browser and refresh with `Ctrl+Shift+R`. If you see the Waste2Goods app, log in as a resident and tap **Redeem Receipt Code** on Home.

**If 5173 shows something else**

Another app, such as the admin panel or kiosk, may be using that port. Start the mobile app on a different port:

```powershell
npm run dev --workspace=@waste2goods/mobile-app -- --port 5180
```

Then open `http://localhost:5180`.

**If you can't tell which app is on 5173**

Find what is using the port and close it:

```powershell
netstat -ano | findstr :5173
```

The last number on the line is the process ID (PID). To stop it, run `taskkill /PID <number> /F`. Only do this if you know it's an old terminal you can close. You can also close the other terminal windows that are running `npm run dev`.

Once the app is open, enter `TEST6789`. If the Redeem button doesn't show, try the `Ctrl+Shift+R` refresh again. Tell me what you see.

