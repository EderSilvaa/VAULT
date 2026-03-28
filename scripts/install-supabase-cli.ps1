# Script PowerShell para instalar Supabase CLI no Windows
# Execute no PowerShell: .\install-supabase-cli.ps1

Write-Host "=== Instalando Supabase CLI ===" -ForegroundColor Cyan

# Criar diretório para o Supabase CLI
$installDir = "$env:LOCALAPPDATA\supabase"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

Write-Host "Baixando Supabase CLI..." -ForegroundColor Yellow

# URL do release mais recente
$downloadUrl = "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip"
$zipFile = "$installDir\supabase.zip"

try {
    # Baixar o arquivo
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing

    Write-Host "Extraindo arquivos..." -ForegroundColor Yellow

    # Extrair o ZIP
    Expand-Archive -Path $zipFile -DestinationPath $installDir -Force

    # Remover o ZIP
    Remove-Item $zipFile

    Write-Host "Adicionando ao PATH..." -ForegroundColor Yellow

    # Adicionar ao PATH do usuário
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$installDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "User")
        $env:Path = "$env:Path;$installDir"
    }

    Write-Host "`n✅ Supabase CLI instalado com sucesso!" -ForegroundColor Green
    Write-Host "`nPara começar a usar:" -ForegroundColor Cyan
    Write-Host "  1. Feche e abra novamente o terminal" -ForegroundColor White
    Write-Host "  2. Execute: supabase --version" -ForegroundColor White
    Write-Host "  3. Execute: supabase login" -ForegroundColor White
    Write-Host "`nLocalização: $installDir" -ForegroundColor Gray

} catch {
    Write-Host "`n❌ Erro ao instalar: $_" -ForegroundColor Red
    Write-Host "`nTente fazer o download manual:" -ForegroundColor Yellow
    Write-Host "  1. Acesse: https://github.com/supabase/cli/releases/latest" -ForegroundColor White
    Write-Host "  2. Baixe: supabase_windows_amd64.zip" -ForegroundColor White
    Write-Host "  3. Extraia para: $installDir" -ForegroundColor White
}

Write-Host "`nPressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
