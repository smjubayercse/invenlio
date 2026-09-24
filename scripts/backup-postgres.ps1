param(
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$Container = 'invenlio-local-postgres-1',
    [string]$Database = 'invenlio',
    [string]$DatabaseUser = 'invenlio'
)

$ErrorActionPreference = 'Stop'
if ($Database -notmatch '^[A-Za-z_][A-Za-z0-9_]*$' -or $DatabaseUser -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
    throw 'Database and user names must be simple PostgreSQL identifiers.'
}
$destination = [IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $destination) { throw "Refusing to overwrite $destination" }
$temporary = "/tmp/invenlio-backup-$([guid]::NewGuid().ToString('N')).dump"
try {
    & docker exec $Container pg_dump -U $DatabaseUser -d $Database -Fc -f $temporary
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed' }
    & docker cp "${Container}:$temporary" $destination
    if ($LASTEXITCODE -ne 0) { throw 'docker cp failed' }
    Write-Host "Backup saved to $destination"
}
finally {
    & docker exec $Container rm -f -- $temporary | Out-Null
}
