@echo off
pushd "C:\epos\server for epos"
start "Node Server" cmd /k "node server.js"
popd

pushd "C:\epos\quasar-project"
REM Install Quasar CLI and dependencies if not present
if not exist node_modules (
  call npm install -g @quasar/cli
  call npm install
)
start "Quasar Dev" cmd /k "quasar dev"
popd