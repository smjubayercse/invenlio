param([switch]$E2E)

$ErrorActionPreference = 'Stop'
$repository = Split-Path -Parent $PSScriptRoot

function Invoke-Checked([string]$Label, [scriptblock]$Command) {
    Write-Host "==> $Label"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

Push-Location $repository
try {
    Invoke-Checked 'Java 21 backend verify' { & .\mvnw.cmd --batch-mode --no-transfer-progress verify }
    Push-Location (Join-Path $repository 'web')
    try {
        Invoke-Checked 'Locked frontend install' { & pnpm install --frozen-lockfile }
        Invoke-Checked 'Frontend format' { & pnpm format:check }
        Invoke-Checked 'Frontend lint' { & pnpm lint }
        Invoke-Checked 'Frontend typecheck' { & pnpm typecheck }
        Invoke-Checked 'Frontend unit tests' { & pnpm test }
        Invoke-Checked 'Frontend production build' { & pnpm build }
        if ($E2E) {
            if (-not $env:E2E_ADMIN_PASSWORD -or -not $env:E2E_READONLY_PASSWORD) {
                throw 'Set E2E_ADMIN_PASSWORD and E2E_READONLY_PASSWORD for the local-only Keycloak users before E2E.'
            }
            Invoke-Checked 'Authenticated browser E2E (live stack required)' { & pnpm test:e2e }
        }
    }
    finally { Pop-Location }
}
finally { Pop-Location }
