Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\Ubeydullah\.gemini\antigravity\brain\d51d4930-3658-4e25-9e7c-a21c2996aed0\.user_uploaded\media_1790637953457.png'
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
$nw = $bmp.Width
$nh = $bmp.Height
Write-Host "Image: ${nw}x${nh}"

# Scan Y range from 35% to 92%
$scanTop = [int]($nh * 0.35)
$scanBottom = [int]($nh * 0.92)
$scanH = $scanBottom - $scanTop
$scanLeft = [int]($nw * 0.08)
$scanW = [int]($nw * 0.84)

$rowDensity = New-Object float[] $scanH

for ($y = 0; $y -lt $scanH; $y++) {
    $dark = 0
    $actualY = $scanTop + $y
    for ($x = 0; $x -lt $scanW; $x++) {
        $actualX = $scanLeft + $x
        $p = $bmp.GetPixel($actualX, $actualY)
        $lum = 0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B
        if ($lum -lt 165) { $dark++ }
    }
    $rowDensity[$y] = $dark
}

# Smooth
$smoothed = New-Object float[] $scanH
$win = [Math]::Max(3, [int]($scanH * 0.015))
for ($y = 0; $y -lt $scanH; $y++) {
    $sum = 0
    $cnt = 0
    for ($w = -$win; $w -le $win; $w++) {
        $py = $y + $w
        if ($py -ge 0 -and $py -lt $scanH) {
            $sum += $rowDensity[$py]
            $cnt++
        }
    }
    $smoothed[$y] = $sum / $cnt
}

# Detect blocks
$blocks = @()
$inBlock = $false
$bStart = 0
$threshold = [Math]::Max(4, [int]($scanW * 0.008))

for ($y = 0; $y -lt $scanH; $y++) {
    if ($smoothed[$y] -gt $threshold) {
        if (-not $inBlock) {
            $inBlock = $true
            $bStart = $y
        }
    } else {
        if ($inBlock) {
            $inBlock = $false
            $bH = $y - $bStart
            if ($bH -ge [int]($nh * 0.018)) {
                $blocks += [PSCustomObject]@{
                    Top = $scanTop + $bStart
                    Bottom = $scanTop + $y
                    Height = $bH
                    YStartInScan = $bStart
                    YEndInScan = $y
                }
            }
        }
    }
}

Write-Host "Detected blocks count: $($blocks.Count)"
foreach ($b in $blocks) {
    # Scan X bounds for this block
    $minX = $nw
    $maxX = 0
    for ($y = $b.YStartInScan; $y -le $b.YEndInScan; $y++) {
        $actualY = $scanTop + $y
        for ($x = 0; $x -lt $scanW; $x++) {
            $actualX = $scanLeft + $x
            $p = $bmp.GetPixel($actualX, $actualY)
            $lum = 0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B
            if ($lum -lt 165) {
                if ($actualX -lt $minX) { $minX = $actualX }
                if ($actualX -gt $maxX) { $maxX = $actualX }
            }
        }
    }
    Write-Host "Block Y: $($b.Top) - $($b.Bottom) (H: $($b.Height)), X: $minX - $maxX (W: $($maxX - $minX))"
}

$bmp.Dispose()
