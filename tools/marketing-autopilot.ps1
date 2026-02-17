param(
  [string]$BaseUrl = "https://yuejian-production.up.railway.app",
  [ValidateSet("soul", "fortune", "both")] [string]$Product = "both",
  [ValidateSet("xiaohongshu", "douyin", "wechat")] [string]$Channel = "xiaohongshu",
  [string]$Vibe = "high-conversion, direct, actionable",
  [switch]$SendViaOpenClaw,
  [string]$OpenClawChannel = "telegram",
  [string]$OpenClawTarget = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Join-Body([string]$Hook, [object[]]$Outline, [string]$Cta) {
  $lines = @()
  if ($Hook) { $lines += $Hook }
  if ($Outline) {
    foreach ($o in $Outline) {
      if ($o) { $lines += ("- " + [string]$o) }
    }
  }
  if ($Cta) { $lines += ("Action: " + $Cta) }
  return ($lines -join "`n")
}

function Build-Summary([object]$Pack, [string]$ProductName, [string]$ChannelName) {
  $goal = [string]$Pack.goal
  $tasks = @($Pack.today_tasks | Select-Object -First 3)
  $ideas = @($Pack.post_ideas | Select-Object -First 2)
  $kpi = $Pack.kpi

  $s = @()
  $s += "[Daily Marketing Pack]"
  $s += "Product: $ProductName | Channel: $ChannelName"
  if ($goal) { $s += "Goal: $goal" }

  if ($tasks.Count -gt 0) {
    $s += "Tasks:"
    for ($i = 0; $i -lt $tasks.Count; $i++) {
      $s += "$($i + 1). $($tasks[$i])"
    }
  }

  if ($ideas.Count -gt 0) {
    $s += "Top Ideas:"
    foreach ($it in $ideas) {
      $s += "- $($it.title)"
    }
  }

  if ($kpi) {
    $s += "KPI: uploads=$($kpi.uploads_target), completion=$($kpi.completion_rate_target), lead=$($kpi.lead_rate_target)"
  }

  $text = ($s -join "`n")
  if ($text.Length -gt 3000) {
    return $text.Substring(0, 3000)
  }
  return $text
}

function Repair-Mojibake([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return $Text }
  if ($Text -match '[\u4e00-\u9fff]') { return $Text }
  if ($Text -notmatch '[ÃÂâäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]') { return $Text }

  $latin1 = [System.Text.Encoding]::GetEncoding(28591)
  try {
    $bytes = $latin1.GetBytes($Text)
    $fixed = [System.Text.Encoding]::UTF8.GetString($bytes)
    if ($fixed -match '[\u4e00-\u9fff]') { return $fixed }
  } catch {
    # keep original text
  }
  return $Text
}

function Repair-Value([object]$Value) {
  if ($null -eq $Value) { return $null }

  if ($Value -is [string]) {
    return Repair-Mojibake -Text $Value
  }

  if ($Value -is [System.Collections.IDictionary]) {
    $out = @{}
    foreach ($k in $Value.Keys) {
      $out[$k] = Repair-Value -Value $Value[$k]
    }
    return [PSCustomObject]$out
  }

  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    $arr = @()
    foreach ($item in $Value) {
      $arr += ,(Repair-Value -Value $item)
    }
    return $arr
  }

  if ($Value -is [pscustomobject]) {
    $out = @{}
    foreach ($p in $Value.PSObject.Properties) {
      $out[$p.Name] = Repair-Value -Value $p.Value
    }
    return [PSCustomObject]$out
  }

  return $Value
}

function Invoke-JsonPostCompat([string]$Url, [object]$Body, [int]$TimeoutSec = 70) {
  $json = $Body | ConvertTo-Json -Depth 16
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $Url -ContentType "application/json; charset=utf-8" -Body $json -TimeoutSec $TimeoutSec
    return (Repair-Value -Value $resp)
  } catch {
    throw
  }
}

function New-FallbackPack([string]$ProductName, [string]$ChannelName, [string]$Reason, [string]$Tone) {
  $tags = @('#情感法医', '#聊天记录分析', '#关系决策')
  if ($ChannelName -eq 'douyin') { $tags = @('#情感', '#关系建议', '#聊天记录分析') }
  if ($ChannelName -eq 'wechat') { $tags = @('#关系复盘', '#沟通', '#情感决策') }

  return [PSCustomObject]@{
    goal = "今日目标：用3条内容验证 $ProductName 在 $ChannelName 的可转化需求（风格：$Tone）"
    today_tasks = @(
      '发布3条内容（案例/方法/观点各1条）',
      '每条内容发布后30分钟内完成首轮评论互动',
      '筛选高意向评论并私信引导试读',
      '记录漏斗数据：曝光/私信/上传/完成/留资',
      '晚间20分钟复盘并更新次日选题'
    )
    post_ideas = @(
      [PSCustomObject]@{
        title = '他到底爱不爱你？先看聊天证据'
        hook = '别再猜了，聊天里早就写了答案。'
        outline = @('展示3个高频信号', '给出反例避免误判', '引导上传截图做试读')
        cta = '发你们最近3-8张连续聊天截图，我先给你试读版。'
        hashtags = $tags
      },
      [PSCustomObject]@{
        title = '高回复不等于高投入'
        hook = '秒回可能只是习惯，不代表关系投入。'
        outline = @('对比回复速度和内容质量', '解释互动密度指标', '给出下一步沟通动作')
        cta = '把记录给我，我帮你拆出可执行下一步。'
        hashtags = $tags
      },
      [PSCustomObject]@{
        title = '关系内耗的24小时止损法'
        hook = '越焦虑越容易做错决定，先做证据化判断。'
        outline = @('什么是低成本证据', '如何判断风险信号', '如何发第一条破冰消息')
        cta = '先做一版分析报告，再决定追还是停。'
        hashtags = $tags
      }
    )
    dm_openers = @(
      '你先别急着下结论，把连续截图发我，我给你先做试读版。',
      '我会按结论-证据-动作给你，直接看下一步怎么做。',
      '先看证据再决策，能少走很多弯路。'
    )
    comment_replies = @(
      '先别内耗，先看聊天行为数据，再决定怎么做。',
      '可以先试读一版，看看结论是否对你有帮助。',
      '关系问题先证据化，再做决定会更稳。'
    )
    kpi = [PSCustomObject]@{
      uploads_target = '300'
      completion_rate_target = '70%'
      lead_rate_target = '8%'
    }
    raw_text = "fallback_reason: $Reason"
  }
}

Write-Host "== Marketing Autopilot =="
Write-Host "BaseUrl: $BaseUrl"
Write-Host "Product: $Product | Channel: $Channel"

$payload = @{
  product = $Product
  channel = $Channel
  vibe    = $Vibe
}

$apiUrl = "$BaseUrl/api/marketing-pack"
$resp = $null
$pack = $null
try {
  $resp = Invoke-JsonPostCompat -Url $apiUrl -Body $payload
  if ($resp -and $resp.ok -and $resp.pack) {
    $pack = $resp.pack
  } else {
    Write-Warning "marketing-pack returned invalid response, switching to fallback pack."
  }
} catch {
  Write-Warning ("marketing-pack request failed: " + $_.Exception.Message)
}

if (-not $pack) {
  $reason = "api_unavailable"
  if ($resp -and $resp.error) {
    $reason = [string]$resp.error
  }
  $pack = New-FallbackPack -ProductName $Product -ChannelName $Channel -Reason $reason -Tone $Vibe
}

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "outputs\marketing\$ts"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$packJsonPath = Join-Path $outDir "marketing-pack.json"
$packMdPath = Join-Path $outDir "marketing-pack.md"
$csvPath = Join-Path $outDir "post-drafts.csv"

$pack | ConvertTo-Json -Depth 12 | Set-Content -Path $packJsonPath -Encoding UTF8

$md = @()
$md += "# Daily Marketing Pack"
$md += ""
$md += "- Generated At: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
$md += "- Product: $Product"
$md += "- Channel: $Channel"
$md += ""
$md += "## Goal"
$md += ([string]$pack.goal)
$md += ""
$md += "## Tasks"
foreach ($t in @($pack.today_tasks)) { $md += "- $t" }
$md += ""
$md += "## Content Ideas"
$idx = 1
foreach ($idea in @($pack.post_ideas)) {
  $md += "### $idx. $($idea.title)"
  $md += "- Hook: $($idea.hook)"
  $md += "- Outline:"
  foreach ($o in @($idea.outline)) { $md += "  - $o" }
  $md += "- CTA: $($idea.cta)"
  $md += "- Tags: $([string]::Join(' ', @($idea.hashtags)))"
  $md += ""
  $idx++
}

$md += "## DM Openers"
foreach ($t in @($pack.dm_openers)) { $md += "- $t" }
$md += ""
$md += "## Comment Replies"
foreach ($t in @($pack.comment_replies)) { $md += "- $t" }
$md += ""
$md += "## KPI"
$md += "- Uploads: $($pack.kpi.uploads_target)"
$md += "- Completion: $($pack.kpi.completion_rate_target)"
$md += "- Lead: $($pack.kpi.lead_rate_target)"

$md -join "`n" | Set-Content -Path $packMdPath -Encoding UTF8

$rows = @()
foreach ($idea in @($pack.post_ideas)) {
  $rows += [PSCustomObject]@{
    channel  = $Channel
    product  = $Product
    title    = [string]$idea.title
    body     = Join-Body -Hook ([string]$idea.hook) -Outline @($idea.outline) -Cta ([string]$idea.cta)
    hashtags = [string]::Join(' ', @($idea.hashtags))
  }
}

if ($rows.Count -gt 0) {
  $rows | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
}

Write-Host "Generated files:"
Write-Host " - $packJsonPath"
Write-Host " - $packMdPath"
if ($rows.Count -gt 0) {
  Write-Host " - $csvPath"
}

if ($SendViaOpenClaw) {
  if (-not $OpenClawTarget) {
    throw "OpenClawTarget is required when SendViaOpenClaw is enabled"
  }

  $summary = Build-Summary -Pack $pack -ProductName $Product -ChannelName $Channel
  Write-Host "Sending summary via OpenClaw..."

  $args = @("message", "send", "--channel", $OpenClawChannel, "--target", $OpenClawTarget, "--message", $summary)
  if ($DryRun) {
    $args += "--dry-run"
  }
  & openclaw @args
}

Write-Host "Marketing autopilot done."
