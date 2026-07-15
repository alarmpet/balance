begin;
select no_plan();
insert into auth.users(id,instance_id,aud,role,encrypted_password,is_anonymous)
values('fe000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','',true);
insert into public.questions(id,author_id,category,visibility,stage,closes_at)
select (substr(md5('close-page-'||n),1,8)||'-'||substr(md5('close-page-'||n),9,4)||'-4'||substr(md5('close-page-'||n),14,3)||'-8'||substr(md5('close-page-'||n),18,3)||'-'||substr(md5('close-page-'||n),21,12))::uuid,
'fe000000-0000-0000-0000-000000000001','pagination','link','pending',now()-interval '1 minute'
from generate_series(1,501) n;
set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select is(public.enqueue_closed_question_notifications(500),500,'first close scan enqueues first page');
select is(public.enqueue_closed_question_notifications(500),1,'second close scan reaches the remaining row');
select is((select count(*)::integer from public.notification_outbox where event='question_closed'),501,'all 501 closed questions are queued');
select * from finish();
rollback;
