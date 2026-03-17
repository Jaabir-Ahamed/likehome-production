-- Enable btree_gist so we can combine = (uuid) with && (daterange) in an exclusion constraint
create extension if not exists btree_gist;

create table "public"."bookings" (
  "id"                       uuid          not null default gen_random_uuid(),
  "user_id"                  uuid          not null,
  "liteapi_booking_id"       text,
  "hotel_confirmation_code"  text,
  "liteapi_offer_id"         text          not null,
  "prebook_id"               text,
  "hotel_id"                 text          not null,
  "hotel_name"               text          not null,
  "hotel_image"              text,
  "check_in"                 date          not null,
  "check_out"                date          not null,
  "guests"                   integer       not null default 1,
  "rooms"                    integer       not null default 1,
  "total_amount"             numeric(12,2) not null,
  "currency"                 text          not null default 'USD',
  "status"                   text          not null default 'reserved',
  "guest_first_name"         text,
  "guest_last_name"          text,
  "guest_email"              text,
  "guest_phone"              text,
  "created_at"               timestamptz   not null default now(),

  constraint "bookings_pkey"
    primary key ("id"),

  constraint "bookings_user_id_fkey"
    foreign key ("user_id") references auth.users("id") on delete cascade,

  constraint "bookings_check_dates"
    check ("check_out" > "check_in"),

  constraint "bookings_status_check"
    check ("status" in ('reserved', 'completed', 'cancelled')),

  constraint "bookings_no_overlap"
    exclude using gist (
      "user_id"  with =,
      daterange("check_in", "check_out") with &&
    )
);

alter table "public"."bookings" enable row level security;

create index "bookings_user_id_idx"
  on "public"."bookings" using btree ("user_id");

create index "bookings_status_idx"
  on "public"."bookings" using btree ("status");

create index "bookings_checkin_idx"
  on "public"."bookings" using btree ("check_in");

-- RLS policies: authenticated users can only see and create their own bookings
create policy "Users can view own bookings"
  on "public"."bookings"
  as permissive
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own bookings"
  on "public"."bookings"
  as permissive
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own bookings"
  on "public"."bookings"
  as permissive
  for update
  to authenticated
  using (auth.uid() = user_id);

-- Service role (used by edge functions) gets full access
grant select, insert, update, delete
  on table "public"."bookings"
  to service_role;

-- Authenticated users get the operations governed by RLS above
grant select, insert, update
  on table "public"."bookings"
  to authenticated;
