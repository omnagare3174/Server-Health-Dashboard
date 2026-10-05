[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$installer = Join-Path $env:TEMP 'python_installer.exe'

$candidates = @(
    'https://www.python.org/ftp/python/3.14.0/python-3.14.0-amd64.exe',
    'https://www.python.org/ftp/python/3.14.0rc2/python-3.14.0rc2-amd64.exe',
    'https://www.python.org/ftp/python/3.14.0rc1/python-3.14.0rc1-amd64.exe',
    'https://www.python.org/ftp/python/3.14.0a6/python-3.14.0a6-amd64.exe',
    'https://www.python.org/ftp/python/3.14.0a5/python-3.14.0a5-amd64.exe',
    'https://www.python.org/ftp/python/3.14.0a4/python-3.14.0a4-amd64.exe'
)

$downloaded = $false
foreach ($url in $candidates) {
    Write-Host "Trying $url..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing -ErrorAction Stop
        if ((Test-Path $installer) -and ((Get-Item $installer).Length -gt 10000000)) {
            Write-Host "Downloaded successfully: $url ($((Get-Item $installer).Length) bytes)"
            $downloaded = $true
            break
        }
    } catch {
        Write-Host "Failed downloading $url : $_"
    }
}

if (-not $downloaded) {
    Write-Host "Could not find standard 3.14 URL, querying python.org ftp directory index..."
    try {
        $html = (Invoke-WebRequest -Uri "https://www.python.org/ftp/python/" -UseBasicParsing).Content
        $matches = [regex]::Matches($html, 'href="3\.14[^/"]*/"')
        foreach ($m in $matches) {
            $verPath = $m.Value.Trim('href="').Trim('"')
            $subUrl = "https://www.python.org/ftp/python/$verPath"
            Write-Host "Found version path: $subUrl"
            $subHtml = (Invoke-WebRequest -Uri $subUrl -UseBasicParsing).Content
            $exeMatches = [regex]::Matches($subHtml, 'href="(python-3\.14[^"]*amd64\.exe)"')
            foreach ($em in $exeMatches) {
                $exeName = $em.Groups[1].Value
                $fileUrl = "$subUrl$exeName"
                Write-Host "Downloading $fileUrl..."
                Invoke-WebRequest -Uri $fileUrl -OutFile $installer -UseBasicParsing
                if ((Test-Path $installer) -and ((Get-Item $installer).Length -gt 10000000)) {
                    Write-Host "Downloaded successfully: $fileUrl"
                    $downloaded = $true
                    break
                }
            }
            if ($downloaded) { break }
        }
    } catch {
        Write-Host "Error scanning index: $_"
    }
}

if (-not $downloaded) {
    Write-Error "Could not download Python 3.14 installer."
    exit 1
}

Write-Host "Starting silent installation of Python 3.14..."
$installArgs = "/quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_launcher=1 Include_test=0"
$proc = Start-Process -FilePath $installer -ArgumentList $installArgs -Wait -PassThru

Write-Host "Installer finished with exit code: $($proc.ExitCode)"

# Refresh PATH in current process
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "Verifying Python installation..."

$pyPath = Get-Command python -ErrorAction SilentlyContinue
if ($pyPath) {
    Write-Host "Found Python at: $($pyPath.Source)"
    & python --version
} else {
    # Check default install locations
    $localPy = Get-ChildItem -Path "$env:LOCALAPPDATA\Programs\Python" -Directory -Filter "Python314*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($localPy) {
        $env:Path = "$($localPy.FullName);$($localPy.FullName)\Scripts;" + $env:Path
        & "$($localPy.FullName)\python.exe" --version
    }
}
