#!/bin/sh
set -e

# Start a virtual X server in the background so headful Chromium has a display.
# Running it detached (rather than wrapping the server in `xvfb-run`) means the
# Node process always starts and logs, even if the display has issues.
Xvfb :99 -screen 0 1366x900x24 -nolisten tcp >/tmp/xvfb.log 2>&1 &
export DISPLAY=:99

# Give Xvfb a moment to come up.
sleep 1

exec "$@"
