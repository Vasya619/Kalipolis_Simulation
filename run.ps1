param(
    [switch]$Quick,
    [string]$Config = '',
    [string]$Output = '',
    [string]$Seed = ''
)
$ErrorActionPreference = 'Stop'
$runtimeCommand = Get-Command node -ErrorAction SilentlyContinue
$runtime = if ($runtimeCommand) { $runtimeCommand.Source } else { Join-Path $env:LOCALAPPDATA 'Programs/Microsoft VS Code/Code.exe' }
if (-not (Test-Path -LiteralPath $runtime)) { throw 'Install Node.js 20+ or use a VS Code installation with its bundled Node runtime.' }
$priorElectronSetting = $env:ELECTRON_RUN_AS_NODE
try {
    if ([IO.Path]::GetFileName($runtime) -eq 'Code.exe') { $env:ELECTRON_RUN_AS_NODE = '1' }
    $simulationArgs = @((Join-Path $PSScriptRoot 'src/cli.mjs'))
    if ($Quick) { $simulationArgs += '--quick' }
    if ($Config) { $simulationArgs += @('--config', $Config) }
    if ($Output) { $simulationArgs += @('--output', $Output) }
    if ($Seed) { $simulationArgs += @('--seed', $Seed) }
    & $runtime @simulationArgs
    if ($LASTEXITCODE -ne 0) { throw "Simulation exited with code $LASTEXITCODE" }
} finally {
    $env:ELECTRON_RUN_AS_NODE = $priorElectronSetting
}
