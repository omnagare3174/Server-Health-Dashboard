# Configure User Environment PATH
$pyDir = "C:\Users\User\AppData\Local\Programs\Python\Python314"
$pyScripts = "C:\Users\User\AppData\Local\Programs\Python\Python314\Scripts"
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")

if ($userPath -notlike "*$pyDir*") {
    $newUserPath = "$pyDir;$pyScripts;$userPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
    Write-Host "Added Python 3.14 to User PATH."
} else {
    Write-Host "Python 3.14 is already in User PATH."
}

# Set current process PATH
$env:Path = "$pyDir;$pyScripts;" + $env:Path

Write-Host "`n=== Checking Python Version ==="
& python --version
& pip --version

Write-Host "`n=== Checking Installed Packages ==="
& pip list

Write-Host "`n=== Testing Imports for Scripts ==="
& python -c "
import influxdb_client
import reactivex
import dateutil
import urllib3
import certifi
import dotenv
import psutil
print('All core dependencies imported successfully in Python 3.14!')
"

Write-Host "`n=== Validating Workspace Scripts ==="
& python -m py_compile server.py
Write-Host "server.py compilation: OK"

& python -m py_compile influx_pipeline.py
Write-Host "influx_pipeline.py compilation: OK"

Write-Host "`n=== Downloading latest wheels for offline_packages cache ==="
& pip download -r requirements.txt -d offline_packages/ --quiet
Write-Host "offline_packages cache updated for Python 3.14."
