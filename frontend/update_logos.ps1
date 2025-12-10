# Script to update all pages with Logo component
$files = @(
    "app\career\page.tsx",
    "app\courses\page.tsx",
    "app\learn\page.tsx",
    "app\mentor\page.tsx",
    "app\pathfinder\page.tsx",
    "app\profile\page.tsx",
    "app\resume\page.tsx",
    "app\roadmap\page.tsx",
    "app\training\page.tsx"
)

$logoImport = "import Logo from '@/components/Logo'"
$logoOldPattern = '<Link href="/" className="text-2xl font-bold gradient-text flex items-center gap-2">\s*<div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center text-white font-bold">\s*TP\s*</div>\s*TrainPi\s*</Link>'
$logoReplacement = '<Logo />'

foreach ($file in $files) {
    $fullPath = "frontend\$file"
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        # Add import if not present
        if ($content -notmatch "import Logo") {
            $content = $content -replace "(import.*from.*['""])", "`$1`n$logoImport"
        }
        # Replace logo
        $content = $content -replace $logoOldPattern, $logoReplacement
        Set-Content $fullPath $content
        Write-Host "Updated $file"
    }
}

