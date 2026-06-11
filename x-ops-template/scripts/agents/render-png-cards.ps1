param(
  [Parameter(Mandatory=$true)][string]$CardsJson,
  [Parameter(Mandatory=$true)][string]$OutputDir
)

Add-Type -AssemblyName System.Drawing
$cards = Get-Content -LiteralPath $CardsJson -Raw -Encoding UTF8 | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function Wrap-Text([System.Drawing.Graphics]$g, [string]$text, [System.Drawing.Font]$font, [int]$maxWidth) {
  $lines = New-Object System.Collections.Generic.List[string]
  $current = ''
  foreach ($ch in $text.ToCharArray()) {
    $candidate = $current + $ch
    $size = $g.MeasureString($candidate, $font)
    if ($size.Width -gt $maxWidth -and $current.Length -gt 0) {
      $lines.Add($current)
      $current = [string]$ch
    } else {
      $current = $candidate
    }
  }
  if ($current.Length -gt 0) { $lines.Add($current) }
  return $lines
}

foreach ($card in $cards) {
  $bmp = New-Object System.Drawing.Bitmap 1080,1440
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush ([System.Drawing.Rectangle]::new(0,0,1080,1440)), ([System.Drawing.Color]::FromArgb(248,250,252)), ([System.Drawing.Color]::FromArgb(224,242,254)), 45
  $g.FillRectangle($bg, 0, 0, 1080, 1440)
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(246,255,255,255))
  $g.FillRoundedRectangle($white, [System.Drawing.Rectangle]::new(52,54,976,1332), [System.Drawing.Size]::new(36,36))

  $fontLabel = New-Object System.Drawing.Font('Microsoft YaHei', 30, [System.Drawing.FontStyle]::Bold)
  $fontTitle = New-Object System.Drawing.Font('Microsoft YaHei', 58, [System.Drawing.FontStyle]::Bold)
  $fontBullet = New-Object System.Drawing.Font('Microsoft YaHei', 34, [System.Drawing.FontStyle]::Bold)
  $fontSmall = New-Object System.Drawing.Font('Microsoft YaHei', 26, [System.Drawing.FontStyle]::Regular)
  $brushDark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,23,42))
  $brushBlue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(3,105,161))
  $brushMuted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(100,116,139))
  $brushGreen = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(34,197,94))
  $brushPanel = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(239,246,255))

  $g.DrawString('X AI Content Radar', $fontLabel, $brushBlue, 72, 88)
  $g.DrawString(('{0}/{1}' -f $card.page, $card.total), $fontSmall, $brushMuted, 860, 94)

  $titleLines = Wrap-Text $g ([string]$card.title) $fontTitle 900
  $y = 190
  foreach ($line in $titleLines | Select-Object -First 4) {
    $g.DrawString($line, $fontTitle, $brushDark, 72, $y)
    $y += 74
  }

  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(186,230,253)), 3
  $g.DrawLine($pen, 72, 440, 1008, 440)

  $y = 520
  foreach ($b in $card.bullets | Select-Object -First 4) {
    $g.FillEllipse($brushGreen, 78, $y - 6, 24, 24)
    $lines = Wrap-Text $g ([string]$b) $fontBullet 800
    $innerY = $y - 24
    foreach ($line in $lines | Select-Object -First 2) {
      $g.DrawString($line, $fontBullet, $brushDark, 124, $innerY)
      $innerY += 46
    }
    $y += 126
  }

  $g.FillRoundedRectangle($brushPanel, [System.Drawing.Rectangle]::new(72,1125,936,142), [System.Drawing.Size]::new(28,28))
  $g.DrawString("$([char]0x9700)$([char]0x8981)$([char]0x56FD)$([char]0x5185)$([char]0x53EF)$([char]0x7528)$([char]0x6A21)$([char]0x578B)$([char]0x63A5)$([char]0x53E3)$([char]0xFF1F)$([char]0x4E7E)$([char]0x7FB2) API", $fontBullet, $brushBlue, 112, 1172)
  $g.DrawString('https://qianxi-api.com · OpenAI-compatible', $fontSmall, $brushMuted, 112, 1222)
  $g.DrawString("Source kept · Human review · Draft only", $fontSmall, $brushMuted, 72, 1336)

  $fileName = "xhs-{0:D2}.png" -f [int]$card.page
  $file = Join-Path $OutputDir $fileName
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

