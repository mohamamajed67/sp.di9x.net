# Đường dẫn file
$filePath = "E:\NodeJS-Project\AI_Tools\ai-project\public\get-tenantID\src\file.txt"

# Đọc nội dung file
$content = Get-Content $filePath

# Tìm các dòng trùng lặp
$duplicates = $content | Group-Object | Where-Object { $_.Count -gt 1 }

if ($duplicates.Count -eq 0) {
    Write-Host "Không tìm thấy dòng trùng lặp nào." -ForegroundColor Green
    exit
}

# Hiển thị các dòng trùng lặp
Write-Host "`nCác dòng trùng lặp được tìm thấy:" -ForegroundColor Yellow
foreach ($dup in $duplicates) {
    Write-Host "`nDòng: $($dup.Name)" -ForegroundColor Cyan
    Write-Host "Số lần xuất hiện: $($dup.Count)" -ForegroundColor Cyan
}

# Hỏi người dùng có muốn xóa không
$confirmation = Read-Host "`nBạn có muốn xóa các dòng trùng lặp không? (Y/N)"

if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
    # Tạo backup file
    $backupPath = "$filePath.backup"
    Copy-Item $filePath $backupPath
    Write-Host "Đã tạo file backup tại: $backupPath" -ForegroundColor Green

    # Xóa các dòng trùng lặp và giữ lại một bản
    $uniqueContent = $content | Select-Object -Unique

    # Ghi nội dung mới vào file
    $uniqueContent | Set-Content $filePath -Force

    # Thống kê
    $removedCount = $content.Count - $uniqueContent.Count
    Write-Host "`nĐã xóa $removedCount dòng trùng lặp." -ForegroundColor Green
    Write-Host "Số dòng ban đầu: $($content.Count)" -ForegroundColor Cyan
    Write-Host "Số dòng sau khi xóa: $($uniqueContent.Count)" -ForegroundColor Cyan
} else {
    Write-Host "`nĐã hủy thao tác xóa." -ForegroundColor Yellow
}