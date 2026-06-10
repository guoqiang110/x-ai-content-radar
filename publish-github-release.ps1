param(
  [string]$RepoName = "x-ai-content-radar",
  [string]$Visibility = "public"
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

git push origin v0.1.0

gh release create v0.1.0 $zip `
  --title "x-ai-content-radar v0.1.0" `
  --notes-file RELEASE_NOTES.md

Write-Host "GitHub Release created for v0.1.0"
