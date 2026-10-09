#!/usr/bin/env bash
# ============================================================================
#  Waste2Goods — remove automatic "50 welcome points" on registration
#  Run THIS ON THE DROPLET (from ~/waste2goods).
#
#    cd ~/waste2goods
#    bash remote-update.sh
#
#  What it does:
#    1. git pull the fix
#    2. rebuild + restart the `api` (backend) and `web` (mobile SPA) containers
#    3. zero out accounts that still hold ONLY the automatic welcome bonus
#       (total_points = 50 AND pointsBalance = 50). Real users who recycled
#       have pointsBalance > 50 and are left untouched.
# ============================================================================
set -euo pipefail

BRANCH="${1:-main}"

cd ~/waste2goods

echo "--- clean and git pull ($BRANCH) ---"
git checkout -- .
git pull --ff-only origin "$BRANCH"

echo "--- rebuild api (backend change) + web (mobile SPA change) ---"
docker compose up -d --build api web

echo "--- zero out welcome-bonus-only accounts (still exactly 50/50) ---"
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root "$MYSQL_DATABASE" -e "
  SELECT userId, email, total_points, pointsBalance
    FROM users WHERE total_points = 50 AND pointsBalance = 50;

  UPDATE users SET total_points = 0, pointsBalance = 0
    WHERE total_points = 50 AND pointsBalance = 50;
  SELECT ROW_COUNT() AS accounts_zeroed;
"'

echo "--- container status ---"
docker compose ps

echo
echo "DONE. New registrations now start at 0 points."
