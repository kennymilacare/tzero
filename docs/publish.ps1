# publish.ps1
#
# Build the site, run the tests, commit, and put it live.
#
# Run it from PowerShell:
#     powershell -ExecutionPolicy Bypass -File ".\docs\publish.ps1"
#
# It does, in order:
#   1. start the local preview on http://127.0.0.1:8765/
#   2. rebuild the news feed from assets/data/manual.json
#   3. rebuild the product pages, the FAQ, the structured data,
#      the language pages and the buying guides
#   4. run the tests and the idempotency check
#   5. commit everything
#   6. regenerate sitemap.xml -- its dates come from git, so it is
#      written after the commit and committed on its own -- and commit that
#   7. push, then check the live site
#
# Nothing is pushed if a test fails.

$repo = Split-Path -Parent $PSScriptRoot
$port = 8765

function Step {
  param([string]$Name, [scriptblock]$Action)
  Write-Host ''
  Write-Host ('==> ' + $Name) -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) {
    Write-Host ('!!! ' + $Name + ' failed (exit code ' + $LASTEXITCODE + ').') -ForegroundColor Red
    Write-Host '    Nothing was pushed. The output above says what went wrong.' -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Set-Location $repo

# ---------- 1. the local preview ----------

Write-Host ''
Write-Host '==> Local preview on port 8765' -ForegroundColor Cyan
$busy = netstat -ano | Select-String ':8765\s+.*LISTENING'
if ($busy) {
  Write-Host ('    already listening on http://127.0.0.1:' + $port + '/')
} else {
  try {
    Start-Process -WindowStyle Hidden -FilePath 'python' `
      -ArgumentList '-m', 'http.server', $port, '--bind', '127.0.0.1' `
      -WorkingDirectory $repo
    Start-Sleep -Seconds 2
    $home = Invoke-WebRequest -Uri ('http://127.0.0.1:' + $port + '/') -UseBasicParsing -TimeoutSec 10
    Write-Host ('    http://127.0.0.1:' + $port + '/ -> ' + $home.StatusCode)
  } catch {
    Write-Host ('    could not start it: ' + $_.Exception.Message) -ForegroundColor Yellow
    Write-Host '    (only the local copy -- the site can still be published)' -ForegroundColor Yellow
  }
}

# ---------- 2. build ----------

Step 'Rebuild the news feed from manual.json' { node scripts/manual-post.mjs }
Step 'Write the product pages'  { node scripts/gen-product-pages.mjs }
Step 'Write the FAQ block'       { node scripts/gen-faq-html.mjs }
Step 'Write the structured data' { node scripts/gen-jsonld.mjs }
Step 'Write the English and Japanese pages' { node scripts/gen-lang-pages.mjs }
Step 'Write the buying guides'   { node scripts/gen-guide-pages.mjs }

# The sitemap says the day each page last changed, and that day comes
# from git. It is written once here so that the tests and the
# idempotency check see a file that matches the generators, and once
# more after the commit below, when the changed pages have a date of
# their own.
Step 'Write sitemap.xml' { node scripts/update-sitemap.mjs }

# ---------- 3. test ----------

Step 'Run the tests' { npm test }
Step 'Check the generators write the same thing twice' { node scripts/check-idempotent.mjs }

# ---------- 4. commit ----------

Write-Host ''
Write-Host '==> What is about to be committed' -ForegroundColor Cyan
git status --short
git add -A
# The sitemap is left out of this commit: it is written again after the
# commit, when the changed pages have a date of their own, and it is
# committed on its own then.
git reset -- sitemap.xml
git diff --cached --stat

Step 'Commit the Watsons links and the new posts' {
  git commit -m 'Buy at Watsons, and the newest posts' `
    -m 'The four product cards and product pages link to the Watsons product pages now instead of an HKTVmall search, and the button says where it goes: Watsons, in all three languages.' `
    -m 'The feed gains the newest Instagram posts, with copy written for the site in Chinese and English, and each card button links to the Watsons page for that product.' `
    -m 'Co-Authored-By: Claude Code <noreply@anthropic.com>'
}

# ---------- 5. the sitemap, after the commit ----------

# The sitemap says the day each page last changed, and that day comes
# from git. It has to be written after the commit, and committed on its
# own, or the tests say the file is out of date.

Step 'Rewrite sitemap.xml with the new dates' { node scripts/update-sitemap.mjs }
Step 'Commit the sitemap' {
  git add sitemap.xml
  git commit -m 'Bring the sitemap dates up to the new posts and links' `
    -m 'Co-Authored-By: Claude Code <noreply@anthropic.com>'
}
Step 'Run the tests once more' { npm test }

# ---------- 6. push ----------

Write-Host ''
Write-Host '==> Pushing to origin main' -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host '!!! The push failed. The commits are safe in the repo -- run: git push origin main' -ForegroundColor Red
  exit $LASTEXITCODE
}

# ---------- 7. check the live site ----------

# The deploy takes a little while, so keep looking for a few minutes.

function Check-Live {
  param([string]$Url, [string]$Marker, [string]$Label)
  $deadline = (Get-Date).AddMinutes(4)
  while ((Get-Date) -lt $deadline) {
    try {
      $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20
      if ($res.Content -match [regex]::Escape($Marker)) {
        Write-Host ('    OK   ' + $Label) -ForegroundColor Green
        return $true
      }
    } catch {
      # not up yet
    }
    Start-Sleep -Seconds 10
  }
  Write-Host ('    MISS ' + $Label + '  (' + $Url + ')') -ForegroundColor Yellow
  return $false
}

Write-Host ''
Write-Host '==> Checking the live site' -ForegroundColor Cyan
$allOk = $true
if (-not (Check-Live 'https://www.tzero-jp.com/assets/data/news.json' 'DfyVYIBERL4' 'the newest post (11-16) is in the feed')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/assets/data/news.json' 'BP_826323' 'the newest post links to its Watsons page')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/assets/data/news.json' 'Dfqqzs9jWPL' 'the newest post (11-13) is in the feed')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/assets/data/news.json' 'DfmDfrxgZ01' 'the second newest post (11-11) is in the feed')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/assets/data/news.json' 'BP_826325' 'the newest post links to its Watsons page')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/products.html' 'BP_826323' 'the Chinese products page links to Watsons')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/products.html' 'BP_826324' 'the studded product links to Watsons')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/product-ultra-thin.html' 'BP_826323' 'the product page links to Watsons')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/en/products.html' 'Buy on Watsons' 'the English button says Watsons')) { $allOk = $false }
if (-not (Check-Live 'https://www.tzero-jp.com/ja/products.html' 'BP_826322' 'the Japanese products page links to Watsons')) { $allOk = $false }

Write-Host ''
if ($allOk) {
  Write-Host 'Done. https://www.tzero-jp.com/ is live with the new links and the two new posts.' -ForegroundColor Green
} else {
  Write-Host 'Pushed, but the live site did not show everything yet.' -ForegroundColor Yellow
  Write-Host 'Look again in a minute -- the deploy can be slow.' -ForegroundColor Yellow
}
Write-Host ''
