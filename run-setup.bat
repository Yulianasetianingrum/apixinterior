@echo off
echo STARTING SETUP %date% %time% > setup-test.log
node scripts/auto-deploy-setup.js >> setup-test.log 2>&1
echo FINISHED SETUP %date% %time% >> setup-test.log
