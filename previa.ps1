# Sobe a prévia da Prime Higienize e abre um link público temporário para o cliente ver.
#   Clique com o botão direito -> "Executar com PowerShell"
#   ou:  powershell -ExecutionPolicy Bypass -File previa.ps1
#
# Ctrl+C derruba tudo. Enquanto este terminal estiver aberto, o link funciona.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$cf = @(
  "$env:ProgramFiles\cloudflared\cloudflared.exe",
  "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe",
  "${env:ProgramFiles(x86)}\cloudflared\cloudflared"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $cf) { Write-Host "  cloudflared não encontrado. Instale com: winget install Cloudflare.cloudflared" -f Red; exit 1 }

Write-Host "`n  Subindo o site..." -f DarkGray
$site = Start-Process node -ArgumentList 'preview-server.mjs' -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

$log = Join-Path $env:TEMP 'prime-previa-tunel.log'
if (Test-Path $log) { Remove-Item $log -Force }
Write-Host "  Abrindo o link público..." -f DarkGray
$tunel = Start-Process $cf -ArgumentList 'tunnel', '--url', 'http://localhost:8806', '--no-autoupdate' `
  -PassThru -WindowStyle Hidden -RedirectStandardError $log

$url = $null
foreach ($i in 1..30) {
  Start-Sleep -Seconds 1
  if (Test-Path $log) {
    $m = [regex]::Match((Get-Content $log -Raw), 'https://[a-z0-9-]+\.trycloudflare\.com')
    if ($m.Success) { $url = $m.Value; break }
  }
}

if (-not $url) {
  Write-Host "`n  O link não abriu. O site continua em http://localhost:8806`n" -f Yellow
} else {
  Write-Host ""
  Write-Host "  ============================================" -f DarkGray
  Write-Host "   PRÉVIA PRIME HIGIENIZE" -f Green
  Write-Host "  ============================================" -f DarkGray
  Write-Host "   $url" -f White
  Write-Host "  ============================================" -f DarkGray
  Write-Host "   Abre direto, sem senha." -f DarkGray
  Write-Host "   Só funciona com este terminal aberto; o link muda a cada vez." -f DarkGray
  Write-Host "   Ctrl+C encerra.`n" -f DarkGray
  Set-Clipboard -Value $url
  Write-Host "   (link copiado para a área de transferência)`n" -f DarkGreen
}

try { while ($true) { Start-Sleep -Seconds 3 } }
finally {
  Write-Host "`n  Encerrando..." -f DarkGray
  foreach ($p in @($tunel, $site)) {
    if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
  }
}
