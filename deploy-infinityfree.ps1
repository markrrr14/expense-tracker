#requires -Version 5.1
<#
.SYNOPSIS
    Builds the Expense Tracker and stages a ready-to-upload InfinityFree package.

.DESCRIPTION
    1. Builds the React frontend with base "/spa/".
    2. Copies the build into Laravel's public/spa folder.
    3. Copies the Laravel app (without vendor/node_modules/.env) into infinityfree/htdocs.
    4. Installs production Composer dependencies and regenerates a non-optimized autoloader
       (InfinityFree silently drops PHP files larger than 1 MB).
    5. Adds the htdocs .htaccess and a production .env template.
    6. Zips infinityfree/htdocs into infinityfree/expense-tracker-infinityfree.zip.

    Upload the contents of infinityfree/htdocs (or the zip) into your account's htdocs.
    Edit infinityfree/htdocs/.env with your InfinityFree MySQL details before uploading.
#>
$ErrorActionPreference = 'Stop'

$root   = $PSScriptRoot
$front  = Join-Path $root 'expense-tracker\expense-tracker'
$back   = Join-Path $root 'expense-tracker-backend\expense-tracker-backend'
$outDir = Join-Path $root 'infinityfree'
$stage  = Join-Path $outDir 'htdocs'
$zip    = Join-Path $outDir 'expense-tracker-infinityfree.zip'

function Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Invoke-Native {
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [string[]]$Arguments = @(),
        [Parameter(Mandatory)][string]$Label
    )

    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $FilePath @Arguments 2>&1 | ForEach-Object { Write-Host $_ }
        $code = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previous
    }

    if ($code -ne 0) {
        throw "$Label failed with exit code $code"
    }
}

if (-not (Test-Path $front)) { throw "Frontend not found: $front" }
if (-not (Test-Path $back))  { throw "Backend not found: $back" }
if (-not (Test-Path (Join-Path $outDir '.htaccess'))) {
    throw "Missing infinityfree/.htaccess"
}
if (-not (Test-Path (Join-Path $outDir '.env.infinityfree'))) {
    throw "Missing infinityfree/.env.infinityfree"
}

Step 'Building React frontend with base /spa/'
Push-Location $front
try {
    if (-not (Test-Path 'node_modules')) {
        Invoke-Native -FilePath 'npm' -Arguments @('install') -Label 'npm install'
    }
    $env:VITE_BASE = '/spa/'
    Invoke-Native -FilePath 'npm' -Arguments @('run', 'build') -Label 'npm run build'
}
finally {
    Pop-Location
    Remove-Item Env:VITE_BASE -ErrorAction SilentlyContinue
}

Step 'Staging Laravel application into infinityfree/htdocs'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

$excludeDirs = @(
    (Join-Path $back 'node_modules'),
    (Join-Path $back 'vendor'),
    (Join-Path $back 'public\spa'),
    (Join-Path $back '.git'),
    (Join-Path $back 'tests')
)
$excludeFiles = @(
    '.env',
    '.env.backup',
    '.env.production',
    'database.sqlite',
    '.phpunit.result.cache',
    '.DS_Store',
    'Thumbs.db',
    '*.log'
)

$robocopyArgs = @($back, $stage, '/E', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/XD') +
    $excludeDirs + @('/XF') + $excludeFiles
& robocopy @robocopyArgs | Out-Null
if ($LASTEXITCODE -ge 8) {
    throw "robocopy failed with exit code $LASTEXITCODE"
}

Step 'Copying React build into public/spa'
$spaStage = Join-Path $stage 'public\spa'
New-Item -ItemType Directory -Path $spaStage -Force | Out-Null
Copy-Item (Join-Path $front 'dist\index.html') $spaStage -Force
Copy-Item (Join-Path $front 'dist\assets') $spaStage -Recurse -Force

Step 'Adding InfinityFree .htaccess and production .env'
Copy-Item (Join-Path $outDir '.htaccess') (Join-Path $stage '.htaccess') -Force
Copy-Item (Join-Path $outDir '.env.infinityfree') (Join-Path $stage '.env') -Force

Step 'Generating a fresh APP_KEY for the package'
$envPath = Join-Path $stage '.env'
$appKey = (& php -r "echo 'base64:'.base64_encode(random_bytes(32));").Trim()
if (-not $appKey) { throw 'Could not generate APP_KEY' }
$envText = Get-Content -LiteralPath $envPath -Raw
$envText = $envText -replace '(?m)^APP_KEY=.*$', "APP_KEY=$appKey"
Set-Content -LiteralPath $envPath -Value $envText -NoNewline

Step 'Installing production Composer dependencies in the staging folder'
Push-Location $stage
try {
    Invoke-Native -FilePath 'composer' `
        -Arguments @('install', '--no-dev', '--no-interaction', '--prefer-dist') `
        -Label 'composer install'

    # Force a non-optimized autoloader so no single PHP file grows past 1 MB.
    Invoke-Native -FilePath 'composer' `
        -Arguments @('config', 'optimize-autoloader', 'false') `
        -Label 'composer config optimize-autoloader'
    Invoke-Native -FilePath 'composer' `
        -Arguments @('dump-autoload', '--no-dev') `
        -Label 'composer dump-autoload'
}
finally {
    Pop-Location
}

Step 'Clearing local caches from the package'
$cleanup = @(
    'storage\framework\cache\data',
    'storage\framework\cache\locks',
    'storage\framework\sessions',
    'storage\framework\views',
    'storage\logs',
    'bootstrap\cache'
)
foreach ($relative in $cleanup) {
    $path = Join-Path $stage $relative
    if (Test-Path $path) {
        Get-ChildItem -LiteralPath $path -Force |
            Where-Object { $_.Name -ne '.gitignore' } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Step 'Checking for PHP files that InfinityFree will reject'
$tooLarge = Get-ChildItem -LiteralPath $stage -Recurse -File -Force |
    Where-Object { $_.Extension -eq '.php' -and $_.Length -ge 1MB }
if ($tooLarge) {
    Write-Warning 'These PHP files are 1 MB or larger and may be silently dropped by InfinityFree:'
    $tooLarge | ForEach-Object { Write-Warning ("  " + $_.FullName) }
}

Step 'Creating upload zip'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $zip) { Remove-Item $zip -Force }

$archive = [System.IO.Compression.ZipFile]::Open(
    $zip,
    [System.IO.Compression.ZipArchiveMode]::Create
)
try {
    $basePath = (Resolve-Path $stage).Path.TrimEnd('\') + '\'
    Get-ChildItem -LiteralPath $stage -Recurse -File -Force | ForEach-Object {
        $relative = $_.FullName.Substring($basePath.Length) -replace '\\', '/'
        $entry = $archive.CreateEntry(
            $relative,
            [System.IO.Compression.CompressionLevel]::Optimal
        )
        $entryStream = $entry.Open()
        try {
            $fileStream = [System.IO.File]::OpenRead($_.FullName)
            try { $fileStream.CopyTo($entryStream) }
            finally { $fileStream.Dispose() }
        }
        finally { $entryStream.Dispose() }
    }
}
finally {
    $archive.Dispose()
}

$files = Get-ChildItem -LiteralPath $stage -Recurse -File -Force
$sizeMb = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1MB, 1)

Write-Host "`nDone." -ForegroundColor Green
Write-Host "  Upload folder : $stage"
Write-Host "  Zip package   : $zip"
Write-Host "  Files         : $($files.Count) ($sizeMb MB)"
Write-Host ""
Write-Host "Before uploading, edit $stage\.env with your InfinityFree MySQL credentials." -ForegroundColor Yellow
Write-Host "Then import infinityfree\database\schema.sql (and optionally seed-demo.sql) in phpMyAdmin." -ForegroundColor Yellow
