@echo off
chcp 65001 >nul
setlocal EnableExtensions
title 飛象老師作品 → 離線版
rem ==========================================================
rem  用法：把飛象老師下載的 .html 檔「拖放」到這個檔案的圖示上。
rem  需要：已安裝 Python 3（python.org 下載，安裝時勾選 Add python.exe to PATH）
rem  轉換時電腦必須聯網；轉換完成後的 *.offline.html 可完全離線使用。
rem  本檔必須和 make_offline.py 放在同一個資料夾。
rem ==========================================================
set "SCRIPT=%~dp0make_offline.py"
if not exist "%SCRIPT%" (
  echo [錯誤] 找不到 make_offline.py，請把它和本檔放在同一個資料夾。
  goto end
)

set "PY="
where py >nul 2>nul
if not errorlevel 1 set "PY=py -3"
if not defined PY (
  where python >nul 2>nul
  if not errorlevel 1 set "PY=python"
)
if not defined PY goto nopython
%PY% -c "import sys" >nul 2>nul
if errorlevel 1 goto nopython

if "%~1"=="" (
  echo 請把飛象老師下載的 .html 檔拖放到「拖放轉換.bat」的圖示上，不要直接雙擊。
  goto end
)

rem 圖片壓縮套件（可選；裝不到也能轉換，只是檔案較大）
%PY% -c "import PIL" >nul 2>nul
if errorlevel 1 (
  echo 正在安裝圖片壓縮套件 Pillow（只需一次）……
  %PY% -m pip install --user --quiet pillow >nul 2>nul
)

:loop
if "%~1"=="" goto done
echo.
echo ▶ 轉換中：%~nx1
%PY% "%SCRIPT%" "%~1"
if errorlevel 1 goto failed
echo [完成] 離線版：%~dpn1.offline.html
goto next
:failed
echo [失敗] %~nx1 —— 請確認電腦已聯網，然後再試一次。
:next
shift
goto loop

:done
echo.
echo 全部完成。請先「關掉 Wi-Fi」再雙擊 *.offline.html 測試一次。
goto end

:nopython
echo [錯誤] 這部電腦未安裝 Python 3。
echo   1. 到 https://www.python.org/downloads/ 下載並安裝（勾選 Add python.exe to PATH）
echo   2. 安裝後再把 .html 拖放到本檔。
goto end

:end
echo.
pause
