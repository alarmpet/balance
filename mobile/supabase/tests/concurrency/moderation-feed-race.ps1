$ErrorActionPreference = 'Stop'

$container = docker ps --format '{{.Names}}' | Where-Object { $_ -like 'supabase_db_*' } | Select-Object -First 1
if (-not $container) { throw 'Local Supabase database container is not running' }

function Invoke-DatabaseSql([string]$Sql) {
  $output = $Sql | docker exec -i $container psql -v ON_ERROR_STOP=1 -U postgres -d postgres -At
  if ($LASTEXITCODE -ne 0) { throw "Database command failed: $output" }
  return $output
}

$setup = @'
begin;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, is_anonymous)
values
 ('b0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','race-author@example.test','',false),
 ('b0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','race-blocked@example.test','',false),
 ('b0000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','race-reporter-one@example.test','',false),
 ('b0000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','race-reporter-two@example.test','',false),
 ('b0000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated','race-reporter-three@example.test','',false),
 ('b0000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000000','authenticated','authenticated','race-feed-report@example.test','',false),
 ('b0000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000000','authenticated','authenticated','race-feed-block@example.test','',false);
insert into public.questions (id, author_id, description, category, visibility, stage)
values
 ('b1000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','report race target','test','public','test'),
 ('b1000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002','block race target','test','public','test');
insert into public.question_options (question_id, code, body)
select q.id, c.code, q.description || ' ' || c.code
from public.questions q cross join (values ('A'), ('B')) c(code)
where q.id in ('b1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002');
update public.questions set stage = 'active'
where id in ('b1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002');
insert into public.reports (reporter_id, question_id, reason, trusted_weight)
values
 ('b0000000-0000-0000-0000-000000000011','b1000000-0000-0000-0000-000000000001','spam',1),
 ('b0000000-0000-0000-0000-000000000012','b1000000-0000-0000-0000-000000000001','spam',1);
commit;
'@
Invoke-DatabaseSql $setup | Out-Null

$reportFirstPageSql = @'
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-000000000021',true);
select next_cursor from public.get_feed(null,1);
commit;
'@
$reportCursor = (Invoke-DatabaseSql $reportFirstPageSql | Where-Object { $_.Length -gt 40 -and $_ -match '^[A-Za-z0-9+/=]+$' } | Select-Object -First 1)
if (-not $reportCursor) { throw 'Report race could not create a continuation cursor' }

$reportSql = @'
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-000000000013',true);
select set_config('request.jwt.claims',json_build_object('sub','b0000000-0000-0000-0000-000000000013','is_anonymous',false)::text,true);
select public.report_question('b1000000-0000-0000-0000-000000000001','spam');
select pg_sleep(3);
commit;
'@
$reportJob = Start-Job -ScriptBlock {
  param($Container, $Sql)
  $Sql | docker exec -i $Container psql -v ON_ERROR_STOP=1 -U postgres -d postgres -At
  if ($LASTEXITCODE -ne 0) { throw 'Concurrent report failed' }
} -ArgumentList $container, $reportSql
Start-Sleep -Milliseconds 1000

$reportFeedSql = @"
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-000000000021',true);
select * from public.get_feed('$reportCursor',50);
commit;
"@
$reportWait = [System.Diagnostics.Stopwatch]::StartNew()
Invoke-DatabaseSql $reportFeedSql | Out-Null
$reportWait.Stop()
$reportJob | Wait-Job | Out-Null
$reportJob | Receive-Job | Out-Null
$reportJob | Remove-Job

$reportExposure = [int](Invoke-DatabaseSql "select count(*) from public.question_exposures where question_id='b1000000-0000-0000-0000-000000000001' and user_id='b0000000-0000-0000-0000-000000000021';")
if ($reportExposure -ne 0) { throw "Report/feed race exposed a limited question: exposures=$reportExposure" }
if ($reportWait.ElapsedMilliseconds -lt 1500) { throw "Feed did not wait for the report row lock: elapsed_ms=$($reportWait.ElapsedMilliseconds)" }

$blockSql = @'
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-000000000022',true);
select public.block_question_author('b1000000-0000-0000-0000-000000000002');
select pg_sleep(3);
commit;
'@
$blockJob = Start-Job -ScriptBlock {
  param($Container, $Sql)
  $Sql | docker exec -i $Container psql -v ON_ERROR_STOP=1 -U postgres -d postgres -At
  if ($LASTEXITCODE -ne 0) { throw 'Concurrent block failed' }
} -ArgumentList $container, $blockSql
Start-Sleep -Milliseconds 1000

$blockFeedSql = @'
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-0000-0000-000000000022',true);
select * from public.get_feed(null,50);
commit;
'@
$blockWait = [System.Diagnostics.Stopwatch]::StartNew()
Invoke-DatabaseSql $blockFeedSql | Out-Null
$blockWait.Stop()
$blockJob | Wait-Job | Out-Null
$blockJob | Receive-Job | Out-Null
$blockJob | Remove-Job

$blockExposure = [int](Invoke-DatabaseSql "select count(*) from public.question_exposures where question_id='b1000000-0000-0000-0000-000000000002' and user_id='b0000000-0000-0000-0000-000000000022';")
if ($blockExposure -ne 0) { throw "Block/feed race exposed a blocked question: exposures=$blockExposure" }
if ($blockWait.ElapsedMilliseconds -lt 1500) { throw "Feed did not wait for the block advisory lock: elapsed_ms=$($blockWait.ElapsedMilliseconds)" }

"report_race_exposures=$reportExposure report_wait_ms=$($reportWait.ElapsedMilliseconds) block_race_exposures=$blockExposure block_wait_ms=$($blockWait.ElapsedMilliseconds)"
