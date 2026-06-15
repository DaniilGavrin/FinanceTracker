# Настройки
$SOURCE_DIR = "src"
$OUTPUT_FILE = "project-export.txt"

$EXCLUDE = @(
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    ".env",
    ".env.local",
    "package-lock.json",
    ".DS_Store",
    "Thumbs.db"
)

$BINARY_EXTENSIONS = @(
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".ico",
    ".svg",
    ".woff",
    ".ttf",
    ".eot",
    ".woff2",
    ".avif",
    ".mp4",
    ".mp3",
    ".pdf"
)

# Удаляем старый файл
if (Test-Path $OUTPUT_FILE) {
    Remove-Item $OUTPUT_FILE
}

# Заголовок
"=== Finance Tracker Project Export ===" | Out-File $OUTPUT_FILE -Encoding utf8
"Дата: $(Get-Date -Format 'dd.MM.yyyy HH:mm:ss')" | Out-File $OUTPUT_FILE -Append -Encoding utf8
"Структура: src/" | Out-File $OUTPUT_FILE -Append -Encoding utf8
"" | Out-File $OUTPUT_FILE -Append -Encoding utf8
"=============================================" | Out-File $OUTPUT_FILE -Append -Encoding utf8

# Получаем файлы
$files = Get-ChildItem $SOURCE_DIR -Recurse -File -ErrorAction SilentlyContinue

$processedCount = 0
$skippedCount = 0

foreach ($file in $files) {
    $filePath = $file.FullName
    $relativePath = $file.FullName -replace [regex]::Escape("$PWD\$SOURCE_DIR\"), ""

    # Проверка исключений по пути
    $skip = $false
    foreach ($ex in $EXCLUDE) {
        if ($relativePath -like "*$ex*" -or $file.Name -like "*$ex*") {
            $skip = $true
            break
        }
    }

    if ($skip) {
        $skippedCount++
        continue
    }

    # Проверка бинарных файлов
    foreach ($ext in $BINARY_EXTENSIONS) {
        if ($file.Extension -eq $ext) {
            $skip = $true
            break
        }
    }

    if ($skip) {
        $skippedCount++
        continue
    }

    # Заголовок файла
    "" | Out-File $OUTPUT_FILE -Append -Encoding utf8
    "─────────────────────────────────────────" | Out-File $OUTPUT_FILE -Append -Encoding utf8
    "FILE: $relativePath" | Out-File $OUTPUT_FILE -Append -Encoding utf8
    "─────────────────────────────────────────" | Out-File $OUTPUT_FILE -Append -Encoding utf8

    # Содержимое
    try {
        Get-Content -LiteralPath $file.FullName -Encoding utf8 | Out-File $OUTPUT_FILE -Append -Encoding utf8
        $processedCount++
    } catch {
        "ERROR: Не удалось прочитать файл" | Out-File $OUTPUT_FILE -Append -Encoding utf8
        $skippedCount++
    }

    "" | Out-File $OUTPUT_FILE -Append -Encoding utf8
}

# Итоговая статистика
"" | Out-File $OUTPUT_FILE -Append -Encoding utf8
"=============================================" | Out-File $OUTPUT_FILE -Append -Encoding utf8
"Обработано файлов: $processedCount" | Out-File $OUTPUT_FILE -Append -Encoding utf8
"Пропущено файлов: $skippedCount" | Out-File $OUTPUT_FILE -Append -Encoding utf8
"Размер экспорта: $((Get-Item $OUTPUT_FILE).Length) байт" | Out-File $OUTPUT_FILE -Append -Encoding utf8

Write-Host ""
Write-Host "Готово! Результат: $OUTPUT_FILE" -ForegroundColor Green
Write-Host "Обработано: $processedCount файлов" -ForegroundColor Cyan
Write-Host "Пропущено: $skippedCount файлов" -ForegroundColor Yellow
Write-Host "Размер: $((Get-Item $OUTPUT_FILE).Length) байт" -ForegroundColor Cyan