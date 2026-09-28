Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\Ubeydullah\.gemini\antigravity\brain\d51d4930-3658-4e25-9e7c-a21c2996aed0\.user_uploaded\media_1790637953457.png'
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"

# Sample rows in the middle where A, B, C, D, E are
# Exclude outer 5% margin
$startX = [int]($bmp.Width * 0.08)
$endX = [int]($bmp.Width * 0.92)

for ($y = [int]($bmp.Height * 0.35); $y -lt [int]($bmp.Height * 0.90); $y += 2) {
    $dark = 0
    $minX = $bmp.Width
    $maxX = 0
    for ($x = $startX; $x -lt $endX; $x += 2) {
        $pixel = $bmp.GetPixel($x, $y)
        # In this screenshot, the text is dark (R<60, G<60, B<60)
        if ($pixel.R -lt 60 -and $pixel.G -lt 60 -and $pixel.B -lt 60) {
            $dark++
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    if ($dark -gt 2) {
        Write-Host "Y: $y, Dark: $dark, X-Range: $minX - $maxX"
    }
}
$bmp.Dispose()
