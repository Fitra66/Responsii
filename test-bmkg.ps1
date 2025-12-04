# Test BMKG Codes for DIY Regions

Write-Host "=== TESTING FORMAT PANJANG (34.XX.XX.XXXX) ===" -ForegroundColor Cyan
Write-Host ""

$longFormats = @(
    @{region="Kota Yogyakarta"; code="34.71.03.1006"},
    @{region="Kabupaten Sleman"; code="34.04.11.2003"},
    @{region="Kabupaten Bantul"; code="34.02.16.2001"},
    @{region="Kabupaten Kulon Progo"; code="34.01.02.2001"},
    @{region="Kabupaten Gunung Kidul"; code="34.03.11.2001"}
)

$validCodes = @()

foreach ($item in $longFormats) {
    $url = "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=$($item.code)"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            if ($data.data -and $data.data.Count -gt 0) {
                Write-Host "✅ $($item.region)" -ForegroundColor Green
                Write-Host "   Kode: $($item.code)"
                Write-Host "   Status: 200 OK"
                Write-Host "   Records: $($data.data.Count)"
                Write-Host "   URL: $url"
                $validCodes += @{region=$item.region; code=$item.code; url=$url}
            } else {
                Write-Host "❌ $($item.region) - No data returned" -ForegroundColor Red
                Write-Host "   Kode: $($item.code)"
            }
        }
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.Value } else { "ERROR" }
        Write-Host "❌ $($item.region)" -ForegroundColor Red
        Write-Host "   Kode: $($item.code)"
        Write-Host "   Status: $statusCode"
    }
    Write-Host ""
}

Write-Host ""
Write-Host "=== TESTING FORMAT PENDEK (3471012) ===" -ForegroundColor Cyan
Write-Host ""

$shortFormats = @(
    @{region="Kota Yogyakarta"; code="3471012"},
    @{region="Kabupaten Sleman"; code="3471011"},
    @{region="Kabupaten Bantul"; code="3471003"},
    @{region="Kabupaten Kulon Progo"; code="3471005"},
    @{region="Kabupaten Gunung Kidul"; code="3471004"}
)

foreach ($item in $shortFormats) {
    $url = "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=$($item.code)"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            if ($data.data -and $data.data.Count -gt 0) {
                Write-Host "✅ $($item.region)" -ForegroundColor Green
                Write-Host "   Kode: $($item.code)"
                Write-Host "   Status: 200 OK"
                Write-Host "   Records: $($data.data.Count)"
                Write-Host "   URL: $url"
                $validCodes += @{region=$item.region; code=$item.code; url=$url}
            } else {
                Write-Host "❌ $($item.region) - No data returned" -ForegroundColor Red
                Write-Host "   Kode: $($item.code)"
            }
        }
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.Value } else { "ERROR" }
        Write-Host "❌ $($item.region)" -ForegroundColor Red
        Write-Host "   Kode: $($item.code)"
        Write-Host "   Status: $statusCode"
    }
    Write-Host ""
}

Write-Host ""
Write-Host "=== HASIL AKHIR ===" -ForegroundColor Yellow
Write-Host ""

if ($validCodes.Count -gt 0) {
    Write-Host "Kode-kode VALID yang ditemukan:" -ForegroundColor Green
    foreach ($code in $validCodes) {
        Write-Host "- Wilayah: $($code.region)"
        Write-Host "  Kode: $($code.code)"
        Write-Host "  URL: $($code.url)"
        Write-Host ""
    }
} else {
    Write-Host "Tidak ada kode yang valid ditemukan. Cek public locations..." -ForegroundColor Yellow
    $url = "https://api.bmkg.go.id/publik/api-prakiraan-cuaca-harian"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "Public locations tersedia: $($data.data.Count) locations"
    } catch {
        Write-Host "Gagal mengakses public locations"
    }
}
