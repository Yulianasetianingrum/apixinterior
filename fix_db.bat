@echo off
echo STARTING FIX...
call npx prisma generate
call npx prisma db push --accept-data-loss
echo FIX COMPLETE.
