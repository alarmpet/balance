$ErrorActionPreference = 'Stop'
$container = 'supabase_db_mobile'
$database = 'balance_upgrade_path_test'

function Invoke-Psql([string]$sql) {
  $sql | docker exec -i $container psql -U supabase_admin -d $database -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) { throw "psql failed for $database" }
}

docker exec $container psql -U supabase_admin -d _supabase -v ON_ERROR_STOP=1 -c "alter database postgres with allow_connections false; select pg_terminate_backend(pid) from pg_stat_activity where datname='postgres';"
try {
  docker exec $container dropdb -U supabase_admin --if-exists $database
  docker exec $container createdb -U supabase_admin -T postgres $database
} finally {
  docker exec $container psql -U supabase_admin -d _supabase -v ON_ERROR_STOP=1 -c "alter database postgres with allow_connections true;"
}

try {
  Invoke-Psql "drop schema public cascade; create schema public; grant all on schema public to postgres; grant usage on schema public to anon, authenticated, service_role;"
  Get-ChildItem "$PSScriptRoot/../migrations/*.sql" | Sort-Object Name | Where-Object Name -LE '202607140006_notifications_and_analytics.sql' | ForEach-Object { Invoke-Psql (Get-Content -Raw -Encoding utf8 $_.FullName) }
  Invoke-Psql @"
insert into auth.users(id,instance_id,aud,role,encrypted_password,is_anonymous)
values('fa000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','',true);
insert into public.questions(id,author_id,category,visibility,stage)
values('fb000000-0000-0000-0000-000000000001','fa000000-0000-0000-0000-000000000001','upgrade','link','pending');
insert into public.notification_deliveries(user_id,question_id,event,token,status,sent_at)
values('fa000000-0000-0000-0000-000000000001','fb000000-0000-0000-0000-000000000001','first_vote','ExponentPushToken[upgrade]','sent',now());
"@
  Get-ChildItem "$PSScriptRoot/../migrations/*.sql" | Sort-Object Name | Where-Object Name -GT '202607140006_notifications_and_analytics.sql' | ForEach-Object { Invoke-Psql (Get-Content -Raw -Encoding utf8 $_.FullName) }
  $status = docker exec $container psql -U supabase_admin -d $database -Atc "select status from public.notification_deliveries where token='ExponentPushToken[upgrade]'"
  if ($status.Trim() -ne 'delivered') { throw "Expected delivered upgrade status, got: $status" }
  Write-Output 'upgrade-path: sent -> delivered PASS'
} finally {
  docker exec $container dropdb -U supabase_admin --if-exists --force $database
}
