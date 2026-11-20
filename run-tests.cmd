@echo off
REM ============================================================
REM  Waste2Goods - one-click test runner (Windows)
REM  Double-click this file, or run it from a terminal:
REM      run-tests.cmd
REM  Safe to run with or without the backend server running.
REM ============================================================
cd /d "%~dp0"

echo ============================================================
echo  [1/2] Security unit tests  (expect 13 pass / 0 fail)
echo ============================================================
call node --test --test-timeout=15000 packages\backend\src\security\security.test.js
if errorlevel 1 echo  !! UNIT TESTS FAILED - see output above

echo.
echo ============================================================
echo  [2/2] Coverage report  (c8 / Istanbul)
echo  (uses a fresh temp dir to dodge a known c8-on-Windows
echo   EPERM rmdir flake when run right after another run)
echo ============================================================
call npx --no-install c8 --temp-directory "%TEMP%\w2g-cov-%RANDOM%" --reporter=lcov --reporter=text-summary npm test
if errorlevel 1 echo  !! COVERAGE RUN FAILED - see output above

echo.
echo ============================================================
echo  DONE.
echo  NOTE: E2E tests (packages\backend\test-e2e.mjs) are NOT run
echo  by this script - they need the live server + MySQL.
echo  To run them yourself:
echo     1. Start XAMPP MySQL
echo     2. npm run start-mysql      (server stays on http://localhost:3001)
echo     3. cd packages\backend
echo     4. node test-e2e.mjs
echo ============================================================
pause
