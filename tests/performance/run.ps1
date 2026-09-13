param(
    [ValidateRange(1, 1000)]
    [int]$Vus = 10,

    [ValidatePattern('^\d+(ms|s|m|h)$')]
    [string]$Duration = '60s',

    [ValidatePattern('^\d+(ms|s|m|h)$')]
    [string]$WarmupDuration = '10s'
)

$composeFile = Join-Path $PSScriptRoot '..\..\compose.e2e.yaml'
$projectDirectory = Split-Path $composeFile -Parent
$exitCode = 1

try {
    docker compose --project-directory $projectDirectory -f $composeFile down --volumes --remove-orphans
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not clean the previous performance-test stack.'
    }

    docker compose --project-directory $projectDirectory -f $composeFile `
        --profile performance run --rm --build `
        -e "EDUMEET_LOAD_VUS=$Vus" `
        -e "EDUMEET_LOAD_DURATION=$Duration" `
        -e "EDUMEET_WARMUP_DURATION=$WarmupDuration" `
        k6
    $exitCode = $LASTEXITCODE
}
finally {
    docker compose --project-directory $projectDirectory -f $composeFile down --volumes --remove-orphans
}

exit $exitCode
