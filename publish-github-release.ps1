param(
  [string]$RepoName = "x-ai-content-radar",
  [string]$Visibility = "public",
  [string]$Version = "v0.1.2"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$zip = "D:\User\HUAWEI\文档\Playground\output\skill-store-packages\x-ai-content-radar-skill.zip"

Set-Location $root

gh auth status

if (-not (git remote get-url origin 2>$null)) {
  gh repo create $RepoName --source . --remote origin --push --$Visibility
} else {
  git push origin master
}

if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path (Join-Path $root '*') -DestinationPath $zip -Force

if (-not (git tag --list $Version)) {
  git tag $Version
}
git push origin $Version

gh release create $Version $zip `
  --title "x-ai-content-radar $Version" `
  --notes-file "RELEASE_NOTES_$Version.md"

Write-Host "GitHub Release created for $Version"
