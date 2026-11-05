$ErrorActionPreference = 'Stop'
$runtimeCommand = Get-Command node -ErrorAction SilentlyContinue
$runtime = if ($runtimeCommand) { $runtimeCommand.Source } else { Join-Path $env:LOCALAPPDATA 'Programs/Microsoft VS Code/Code.exe' }
if (-not (Test-Path -LiteralPath $runtime)) { throw 'Node.js 20+ or VS Code is required.' }
$priorElectronSetting = $env:ELECTRON_RUN_AS_NODE
try {
    if ([IO.Path]::GetFileName($runtime) -eq 'Code.exe') { $env:ELECTRON_RUN_AS_NODE = '1' }
    $testFiles = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'tests') -Filter '*.test.mjs' | Select-Object -ExpandProperty FullName
    & $runtime --test @testFiles
    if ($LASTEXITCODE -ne 0) { throw "Tests exited with code $LASTEXITCODE" }
} finally {
    $env:ELECTRON_RUN_AS_NODE = $priorElectronSetting
}
