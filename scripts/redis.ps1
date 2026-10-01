# ============================================================
#  Waste2Goods — Redis helper (Windows / PowerShell)
# ============================================================
#  Starts, stops and inspects the Redis container the backend
#  expects on 127.0.0.1:6379 (see packages/backend/.env).
#
#  Usage:
#    pwsh -File scripts/redis.ps1 up       # start (creates container if needed)
#    pwsh -File scripts/redis.ps1 down     # stop
#    pwsh -File scripts/redis.ps1 status   # is it running + reachable?
#    pwsh -File scripts/redis.ps1 logs     # last 40 log lines
#    pwsh -File scripts/redis.ps1 reset    # delete container and recreate
#
#  Requires Docker Desktop.
# ============================================================

param(
  [ValidateSet('up', 'down', 'status', 'logs', 'reset')]
  [string]$Action = 'up',
  [string]$ContainerName = 'w2g-redis',
  [string]$Image = 'redis:alpine',
  [int]$Port = 6379
)

$ErrorActionPreference = 'Continue'
$dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'

function Test-DockerEngine {
  docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Wait-DockerEngine {
  param([int]$TimeoutSeconds = 180)

  if (Test-DockerEngine) { return $true }

  Write-Host 'Waiting for the Docker engine - starting Docker Desktop...' -ForegroundColor Yellow
  if (Test-Path $dockerDesktop) {
    Start-Process $dockerDesktop | Out-Null
  } else {
    Write-Host "ERROR: Docker Desktop not found at $dockerDesktop" -ForegroundColor Red
    Write-Host '       Install it from https://www.docker.com/products/docker-desktop/' -ForegroundColor Red
    return $false
  }

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 4
    if (Test-DockerEngine) {
      Write-Host 'OK: Docker engine is up.' -ForegroundColor Green
      return $true
    }
    Write-Host '.' -NoNewline
  }
  Write-Host ''
  Write-Host 'ERROR: Timed out waiting for the Docker engine. Open Docker Desktop manually,' -ForegroundColor Red
  Write-Host '       wait until it says "Engine running", then retry.' -ForegroundColor Red
  Write-Host '       No Docker? Alternative: wsl --install -d Ubuntu  then  sudo apt install -y redis-server' -ForegroundColor DarkGray
  return $false
}

function Test-RedisReachable {
  param([int]$RedisPort = 6379)
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect('127.0.0.1', $RedisPort)
    $ok = $client.Connected
    $client.Close()
    return $ok
  } catch {
    return $false
  }
}

function Get-ContainerStatus {
  # NOTE: do NOT pipe this through Select-Object -First 1 - that ends the
  # pipeline early and PowerShell then leaves $LASTEXITCODE stale, which
  # would make an existing (stopped) container look like "not-created".
  $raw = docker inspect --format '{{.State.Status}}' $ContainerName 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($raw)) { return 'not-created' }
  return ([string]$raw).Trim()
}

switch ($Action) {

  'up' {
    if (-not (Wait-DockerEngine)) { exit 1 }

    $state = Get-ContainerStatus
    if ($state -eq 'not-created') {
      Write-Host "Creating container '$ContainerName' from $Image ..." -ForegroundColor Cyan
      docker run -d --name $ContainerName -p "${Port}:6379" $Image | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Write-Host 'ERROR: docker run failed. Is port 6379 already in use?' -ForegroundColor Red
        exit 1
      }
    } elseif ($state -ne 'running') {
      Write-Host "Starting existing container '$ContainerName' (was: $state) ..." -ForegroundColor Cyan
      docker start $ContainerName | Out-Null
    } else {
      Write-Host "Container '$ContainerName' is already running." -ForegroundColor DarkGray
    }

    # Wait until Redis actually answers PING
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
      $pong = (docker exec $ContainerName redis-cli ping 2>$null | Select-Object -First 1)
      if ($pong -and $pong.Trim() -eq 'PONG') { $ready = $true; break }
      Start-Sleep -Milliseconds 750
    }

    if ($ready -and (Test-RedisReachable -RedisPort $Port)) {
      Write-Host "OK: Redis is READY on 127.0.0.1:$Port (container: $ContainerName)" -ForegroundColor Green
      Write-Host ''
      Write-Host 'Next steps:' -ForegroundColor Cyan
      Write-Host '  1. Make sure packages/backend/.env has:  REDIS_ENABLED=true'
      Write-Host '  2. Restart the backend:                  npm run start-mysql'
      Write-Host '  3. Confirm Redis is live:                 npm run redis:check'
      Write-Host '     (look for "Redis connected: namespace=w2g:")'
      exit 0
    }

    Write-Host 'ERROR: Redis container is up but not answering PING on 127.0.0.1.' -ForegroundColor Red
    Write-Host '       Inspect it with:  pwsh -File scripts/redis.ps1 logs' -ForegroundColor DarkGray
    exit 1
  }

  'down' {
    if (-not (Test-DockerEngine)) {
      Write-Host 'Docker engine is not running - nothing to stop.' -ForegroundColor DarkGray
      exit 0
    }
    Write-Host "Stopping '$ContainerName' ..." -ForegroundColor Cyan
    docker stop $ContainerName | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-Host 'OK: Redis stopped. The backend now falls back to its in-memory store.' -ForegroundColor Green
      exit 0
    }
    Write-Host "ERROR: Could not stop '$ContainerName' (was it ever created?)." -ForegroundColor Red
    exit 1
  }

  'reset' {
    if (-not (Wait-DockerEngine)) { exit 1 }
    Write-Host "Removing '$ContainerName' (all cached data will be lost) ..." -ForegroundColor Cyan
    docker rm -f $ContainerName 2>$null | Out-Null
    & $PSCommandPath up
    exit $LASTEXITCODE
  }

  'logs' {
    docker logs --tail 40 $ContainerName 2>&1 | Out-String | Write-Host
    exit 0
  }


}


if ($Action -eq 'status') {
  $engine = Test-DockerEngine
  $state = if ($engine) { Get-ContainerStatus } else { 'unknown (engine down)' }
  $reachable = Test-RedisReachable -RedisPort $Port

  Write-Host 'Waste2Goods Redis status' -ForegroundColor Cyan
  Write-Host ('  Docker engine : ' + $(if ($engine) { 'running' } else { 'not running' }))
  Write-Host "  Container     : $ContainerName -> $state"
  Write-Host "  127.0.0.1:$Port : $(if ($reachable) { 'REACHABLE [ok]' } else { 'not reachable [x]' })"

  if ($reachable) {
    $ping = (docker exec $ContainerName redis-cli ping 2>$null | Select-Object -First 1)
    Write-Host "  PING          : $ping"
    $keys = (docker exec $ContainerName redis-cli --scan --pattern 'w2g:*' 2>$null | Measure-Object).Count
    Write-Host "  w2g:* keys    : $keys"
  }
  Write-Host ''
  Write-Host '  App-side check: npm run redis:check' -ForegroundColor DarkGray

  if ($reachable) { exit 0 } else { exit 1 }
}

