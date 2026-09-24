param(
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][string]$TargetDatabase,
    [string]$Container = 'invenlio-local-postgres-1',
    [string]$DatabaseUser = 'invenlio'
)

$ErrorActionPreference = 'Stop'
if ($TargetDatabase -notmatch '^[A-Za-z_][A-Za-z0-9_]*$' -or $DatabaseUser -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
    throw 'Database and user names must be simple PostgreSQL identifiers.'
}
$source = [IO.Path]::GetFullPath($InputPath)
if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Backup not found: $source" }
$existing = & docker exec $Container psql -U $DatabaseUser -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = '$TargetDatabase'"
if ($LASTEXITCODE -ne 0) { throw 'Database existence check failed' }
if ($existing -match '1') { throw "Refusing to restore over existing database $TargetDatabase" }
$temporary = "/tmp/invenlio-restore-$([guid]::NewGuid().ToString('N')).dump"
try {
    & docker cp $source "${Container}:$temporary"
    if ($LASTEXITCODE -ne 0) { throw 'docker cp failed' }
    & docker exec $Container createdb -U $DatabaseUser $TargetDatabase
    if ($LASTEXITCODE -ne 0) { throw 'createdb failed' }
    & docker exec $Container pg_restore -U $DatabaseUser -d $TargetDatabase --no-owner --no-privileges --exit-on-error $temporary
    if ($LASTEXITCODE -ne 0) { throw "Restore failed; inspect the new database $TargetDatabase before cleanup" }
    Write-Host "Restored to separate database $TargetDatabase"
}
finally {
    & docker exec $Container rm -f -- $temporary | Out-Null
}
