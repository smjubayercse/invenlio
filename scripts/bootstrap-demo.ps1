param(
    [string]$KeycloakContainer = 'invenlio-local-keycloak-1',
    [string]$PostgresContainer = 'invenlio-local-postgres-1'
)

$ErrorActionPreference = 'Stop'
if (-not $env:DEMO_KEYCLOAK_ADMIN_PASSWORD -or -not $env:DEMO_ADMIN_PASSWORD -or -not $env:DEMO_READONLY_PASSWORD) {
    throw 'Set DEMO_KEYCLOAK_ADMIN_PASSWORD, DEMO_ADMIN_PASSWORD and DEMO_READONLY_PASSWORD for this local-only bootstrap.'
}

$kc = '/opt/keycloak/bin/kcadm.sh'
& docker exec $KeycloakContainer $kc config credentials --server http://localhost:8080 --realm master --user admin --password $env:DEMO_KEYCLOAK_ADMIN_PASSWORD
if ($LASTEXITCODE -ne 0) { throw 'Keycloak admin authentication failed' }
$profile = Join-Path (Split-Path -Parent $PSScriptRoot) 'docker/keycloak/demo-user-profile.json'
& docker cp $profile "${KeycloakContainer}:/tmp/demo-user-profile.json"
if ($LASTEXITCODE -ne 0) { throw 'Could not copy local user profile configuration' }
& docker exec $KeycloakContainer $kc update users/profile -r invenlio -f /tmp/demo-user-profile.json
if ($LASTEXITCODE -ne 0) { throw 'Could not allow the local tenant_id user attribute' }

$readonlyRows = & docker exec $KeycloakContainer $kc get users -r invenlio -q username=readonly@invenlio.local --fields id,username --format csv
if ($LASTEXITCODE -ne 0) { throw 'Could not query read-only Keycloak user' }
if (-not $readonlyRows) {
    $definition = Join-Path (Split-Path -Parent $PSScriptRoot) 'docker/keycloak/demo-readonly-user.json'
    & docker cp $definition "${KeycloakContainer}:/tmp/demo-readonly-user.json"
    if ($LASTEXITCODE -ne 0) { throw 'Could not copy read-only user definition' }
    & docker exec $KeycloakContainer $kc create users -r invenlio -f /tmp/demo-readonly-user.json
    if ($LASTEXITCODE -ne 0) { throw 'Could not create read-only Keycloak user' }
    $readonlyRows = & docker exec $KeycloakContainer $kc get users -r invenlio -q username=readonly@invenlio.local --fields id,username --format csv
}
$readonlySubject = [regex]::Match(($readonlyRows -join "`n"), '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}').Value
if (-not $readonlySubject) { throw 'Could not resolve read-only Keycloak subject ID' }
& docker exec $KeycloakContainer $kc update "users/$readonlySubject" -r invenlio -s 'attributes.tenant_id=11111111-1111-4111-8111-111111111111'
if ($LASTEXITCODE -ne 0) { throw 'Could not assign read-only tenant attribute' }
& docker exec $KeycloakContainer $kc update users/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa -r invenlio -s firstName=Local -s lastName=Administrator
if ($LASTEXITCODE -ne 0) { throw 'Could not update demo administrator profile' }
& docker exec $KeycloakContainer $kc set-password -r invenlio --username admin@invenlio.local --new-password $env:DEMO_ADMIN_PASSWORD --temporary=false
if ($LASTEXITCODE -ne 0) { throw 'Could not set demo administrator password' }
& docker exec $KeycloakContainer $kc set-password -r invenlio --username readonly@invenlio.local --new-password $env:DEMO_READONLY_PASSWORD --temporary=false
if ($LASTEXITCODE -ne 0) { throw 'Could not set read-only password' }

$sql = Join-Path $PSScriptRoot 'local-bootstrap.sql'
Get-Content -LiteralPath $sql -Raw | docker exec -i $PostgresContainer psql -U invenlio -d invenlio -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw 'Database demo bootstrap failed' }
$readonlySql = Join-Path $PSScriptRoot 'local-readonly-bootstrap.sql'
Get-Content -LiteralPath $readonlySql -Raw | docker exec -i $PostgresContainer psql -U invenlio -d invenlio -v ON_ERROR_STOP=1 -v "readonly_subject=$readonlySubject"
if ($LASTEXITCODE -ne 0) { throw 'Read-only membership bootstrap failed' }
Write-Host 'Local-only tenant, administrator, and read-only user are ready.'
