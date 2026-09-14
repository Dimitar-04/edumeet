<#
.SYNOPSIS
Runs one or more EduMeet test suites and stops on the first failure.

.EXAMPLE
.\run-tests.ps1

.EXAMPLE
.\run-tests.ps1 -Suite BackendUnit,Frontend

.EXAMPLE
.\run-tests.ps1 -Suite Performance -PerformanceVus 20 -PerformanceDuration 2m
#>
[CmdletBinding()]
param(
    [string[]]$Suite = @('All'),

    [ValidateRange(1, 1000)]
    [int]$PerformanceVus = 10,

    [ValidatePattern('^\d+(ms|s|m|h)$')]
    [string]$PerformanceDuration = '60s',

    [ValidatePattern('^\d+(ms|s|m|h)$')]
    [string]$PerformanceWarmupDuration = '10s'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repositoryRoot = $PSScriptRoot
$backendRoot = Join-Path $repositoryRoot 'backend\EduMeetBackend'
$frontendRoot = Join-Path $repositoryRoot 'frontend\EduMeetFrontend'
$performanceRunner = Join-Path $repositoryRoot 'tests\performance\run.ps1'

$suiteOrder = @(
    'BackendUnit',
    'Frontend',
    'Integration',
    'Api',
    'E2E',
    'Mutation',
    'Performance'
)

$requestedSuites = @(
    $Suite |
        ForEach-Object { $_ -split ',' } |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ }
)
$validSuites = @('All') + $suiteOrder
$invalidSuites = @($requestedSuites | Where-Object { $_ -notin $validSuites })

if ($invalidSuites.Count -gt 0) {
    throw "Unknown suite(s): $($invalidSuites -join ', '). " +
        "Valid values: $($validSuites -join ', ')."
}

if ($requestedSuites -contains 'All' -and $requestedSuites.Count -gt 1) {
    throw "'All' cannot be combined with individual suite names."
}

$selectedSuites = if ($requestedSuites -contains 'All') {
    $suiteOrder
}
else {
    $suiteOrder | Where-Object { $requestedSuites -contains $_ }
}

function Invoke-TestStep {
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [scriptblock]$Command
    )

    Write-Host ''
    Write-Host "=== $Name ===" -ForegroundColor Cyan

    & $Command
    $commandExitCode = $LASTEXITCODE

    if ($commandExitCode -ne 0) {
        throw "$Name failed with exit code $commandExitCode."
    }

    Write-Host "PASSED: $Name" -ForegroundColor Green
}

function Invoke-InDirectory {
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [scriptblock]$Command
    )

    Push-Location $Path
    try {
        & $Command
    }
    finally {
        Pop-Location
    }
}

try {
    foreach ($selectedSuite in $selectedSuites) {
        switch ($selectedSuite) {
            'BackendUnit' {
                $unitProjects = @(
                    '5. Tests\Application.UnitTests\Application.UnitTests.csproj',
                    '5. Tests\Infrastructure.UnitTests\Infrastructure.UnitTests.csproj',
                    '5. Tests\Presentation.UnitTests\Presentation.UnitTests.csproj'
                )

                foreach ($relativeProject in $unitProjects) {
                    $unitProject = Join-Path $backendRoot $relativeProject
                    $projectName = [System.IO.Path]::GetFileNameWithoutExtension($unitProject)

                    Invoke-TestStep "Backend unit tests: $projectName" {
                        dotnet test $unitProject --configuration Release --nologo
                    }
                }
            }

            'Frontend' {
                Invoke-TestStep 'Frontend component tests' {
                    Invoke-InDirectory $frontendRoot {
                        npm test
                    }
                }
            }

            'Integration' {
                $integrationProject = Join-Path $backendRoot `
                    '5. Tests\Infrastructure.IntegrationTests\Infrastructure.IntegrationTests.csproj'

                Invoke-TestStep 'PostgreSQL integration tests' {
                    dotnet test $integrationProject --configuration Release --nologo
                }
            }

            'Api' {
                $apiProject = Join-Path $backendRoot `
                    '5. Tests\Presentation.ApiTests\Presentation.ApiTests.csproj'

                Invoke-TestStep 'HTTP API tests' {
                    dotnet test $apiProject --configuration Release --nologo
                }
            }

            'E2E' {
                Invoke-TestStep 'Playwright end-to-end tests' {
                    Invoke-InDirectory $frontendRoot {
                        npm run test:e2e
                    }
                }
            }

            'Mutation' {
                $mutationDirectory = Join-Path $backendRoot `
                    '5. Tests\Application.UnitTests'

                Invoke-TestStep 'Stryker mutation tests' {
                    Invoke-InDirectory $mutationDirectory {
                        dotnet stryker --config-file stryker-config.json
                    }
                }
            }

            'Performance' {
                Invoke-TestStep 'k6 performance tests' {
                    powershell -NoProfile -ExecutionPolicy Bypass `
                        -File $performanceRunner `
                        -Vus $PerformanceVus `
                        -Duration $PerformanceDuration `
                        -WarmupDuration $PerformanceWarmupDuration
                }
            }
        }
    }

    Write-Host ''
    Write-Host "All selected suites passed: $($selectedSuites -join ', ')" `
        -ForegroundColor Green
    exit 0
}
catch {
    Write-Host ''
    Write-Error $_
    exit 1
}
