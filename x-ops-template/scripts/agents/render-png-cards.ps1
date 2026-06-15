param(
  [Parameter(Mandatory=$true)][string]$CardsJson,
  [Parameter(Mandatory=$true)][string]$OutputDir
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$cards = Get-Content -LiteralPath $CardsJson -Raw -Encoding UTF8 | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function C([int]$r, [int]$g, [int]$b) {
  return [System.Drawing.Color]::FromArgb($r, $g, $b)
}

function Brush([System.Drawing.Color]$color) {
  return New-Object System.Drawing.SolidBrush $color
}

function Fill-RoundedRect(
  [System.Drawing.Graphics]$g,
  [System.Drawing.Brush]$brush,
  [System.Drawing.Rectangle]$rect,
  [int]$radius
) {
  $diameter = $radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $g.FillPath($brush, $path)
  $path.Dispose()
}

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

$palettes = @(
  @{ bg1 = C 252 247 237; bg2 = C 219 234 254; ink = C 17 24 39; accent = C 37 99 235; soft = C 239 246 255; tag = 'HOT SIGNAL' },
  @{ bg1 = C 240 253 250; bg2 = C 236 253 245; ink = C 15 23 42; accent = C 13 148 136; soft = C 204 251 241; tag = 'PAIN POINT' },
  @{ bg1 = C 250 245 255; bg2 = C 245 243 255; ink = C 30 27 75; accent = C 124 58 237; soft = C 237 233 254; tag = 'WHAT IT IS' },
  @{ bg1 = C 255 247 237; bg2 = C 254 243 199; ink = C 67 20 7; accent = C 234 88 12; soft = C 255 237 213; tag = 'CORE IDEA' },
  @{ bg1 = C 248 250 252; bg2 = C 220 252 231; ink = C 20 83 45; accent = C 22 163 74; soft = C 220 252 231; tag = 'AUTOMATION' },
  @{ bg1 = C 239 246 255; bg2 = C 224 242 254; ink = C 12 74 110; accent = C 2 132 199; soft = C 224 242 254; tag = 'HOW TO START' },
  @{ bg1 = C 255 251 235; bg2 = C 254 249 195; ink = C 66 32 6; accent = C 202 138 4; soft = C 254 249 195; tag = 'USE CASES' },
  @{ bg1 = C 245 245 244; bg2 = C 231 229 228; ink = C 28 25 23; accent = C 87 83 78; soft = C 231 229 228; tag = 'API SETUP' },
  @{ bg1 = C 241 245 249; bg2 = C 226 232 240; ink = C 15 23 42; accent = C 220 38 38; soft = C 254 226 226; tag = 'SAVE THIS' }
)

foreach ($card in $cards) {
  $page = [int]$card.page
  $palette = $palettes[($page - 1) % $palettes.Count]

  $bmp = New-Object System.Drawing.Bitmap 1080,1440
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush ([System.Drawing.Rectangle]::new(0,0,1080,1440)), $palette.bg1, $palette.bg2, 35
  $g.FillRectangle($bg, 0, 0, 1080, 1440)

  $brushInk = Brush $palette.ink
  $brushAccent = Brush $palette.accent
  $brushSoft = Brush $palette.soft
  $brushWhite = Brush ([System.Drawing.Color]::FromArgb(242,255,255,255))
  $brushMuted = Brush (C 100 116 139)
  $brushDarkMuted = Brush (C 71 85 105)

  $fontLabel = New-Object System.Drawing.Font('Microsoft YaHei', 26, [System.Drawing.FontStyle]::Bold)
  $fontTag = New-Object System.Drawing.Font('Arial', 24, [System.Drawing.FontStyle]::Bold)
  $fontTitle = New-Object System.Drawing.Font('Microsoft YaHei', 56, [System.Drawing.FontStyle]::Bold)
  $fontBullet = New-Object System.Drawing.Font('Microsoft YaHei', 34, [System.Drawing.FontStyle]::Bold)
  $fontSmall = New-Object System.Drawing.Font('Arial', 24, [System.Drawing.FontStyle]::Regular)
  $fontCode = New-Object System.Drawing.Font('Consolas', 24, [System.Drawing.FontStyle]::Regular)

  Fill-RoundedRect $g $brushWhite ([System.Drawing.Rectangle]::new(54,54,972,1332)) 28
  $g.FillRectangle($brushAccent, 54, 54, 18, 1332)

  Fill-RoundedRect $g $brushSoft ([System.Drawing.Rectangle]::new(92,88,245,58)) 18
  $g.DrawString([string]$palette.tag, $fontTag, $brushAccent, 114, 105)
  $g.DrawString(('X AI Radar {0}/{1}' -f $card.page, $card.total), $fontSmall, $brushMuted, 790, 105)

  $titleLines = Wrap-Text $g ([string]$card.title) $fontTitle 860
  $y = 196
  foreach ($line in $titleLines | Select-Object -First 3) {
    $g.DrawString($line, $fontTitle, $brushInk, 92, $y)
    $y += 76
  }

  $pen = New-Object System.Drawing.Pen $palette.accent, 5
  $g.DrawLine($pen, 92, 448, 988, 448)

  $y = 520
  $bulletIndex = 1
  foreach ($b in $card.bullets | Select-Object -First 4) {
    Fill-RoundedRect $g $brushSoft ([System.Drawing.Rectangle]::new(92, $y - 28, 896, 112)) 22
    $g.FillEllipse($brushAccent, 118, $y, 42, 42)
    $g.DrawString([string]$bulletIndex, $fontSmall, $brushWhite, 132, $y + 6)
    $lines = Wrap-Text $g ([string]$b) $fontBullet 760
    $innerY = $y - 10
    foreach ($line in $lines | Select-Object -First 2) {
      $g.DrawString($line, $fontBullet, $brushInk, 184, $innerY)
      $innerY += 46
    }
    $y += 138
    $bulletIndex += 1
  }

  if (($card.bullets | Measure-Object).Count -eq 0) {
    $g.DrawString('No parsed bullets. Check carousel.md format.', $fontBullet, $brushMuted, 92, 540)
  }

  Fill-RoundedRect $g $brushSoft ([System.Drawing.Rectangle]::new(92,1128,896,136)) 24
  $g.DrawString('Qianxi API for OpenAI-compatible workflows', $fontLabel, $brushAccent, 124, 1168)
  $g.DrawString('https://qianxi-api.com/v1', $fontCode, $brushDarkMuted, 124, 1212)
  $g.DrawString('Source kept | Human review | Draft only', $fontSmall, $brushMuted, 92, 1334)

  $fileName = "xhs-{0:D2}.png" -f $page
  $file = Join-Path $OutputDir $fileName
  $tmpFile = Join-Path $OutputDir ("tmp-{0}.png" -f [System.Guid]::NewGuid().ToString('N'))
  $bmp.Save($tmpFile, [System.Drawing.Imaging.ImageFormat]::Png)
  try {
    if (Test-Path -LiteralPath $file) {
      Remove-Item -LiteralPath $file -Force
    }
    Move-Item -LiteralPath $tmpFile -Destination $file -Force
  } catch {
    $fallbackName = "xhs-{0:D2}-new.png" -f $page
    Move-Item -LiteralPath $tmpFile -Destination (Join-Path $OutputDir $fallbackName) -Force
  }
  $g.Dispose()
  $bmp.Dispose()
}
