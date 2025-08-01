@echo off
pushd "C:\epos\server for epos"
start "Node Server" cmd /k "node server.js"
popd

pushd "C:\epos\quasar-project"
start "Quasar Dev" cmd /k "quasar dev"
popd