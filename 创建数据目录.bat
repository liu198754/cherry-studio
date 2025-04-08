@rem made by liuj in 2025
@echo off
setlocal
set DATA_FOLD_NAME=CherryStudio
set CUR_PATH=%~dp0
set DATA_PATH=%CUR_PATH%%DATA_FOLD_NAME%
set APP_DATA_PATH=%appdata%\%DATA_FOLD_NAME%

:checkdir
if not exist "%DATA_PATH%" (
    mkdir "%DATA_PATH%"
    echo Directory created: %DATA_PATH%
) 

echo start create link fold %APP_DATA_PATH% TO %DATA_PATH%

mklink /D %APP_DATA_PATH% %DATA_PATH%

endlocal
pause