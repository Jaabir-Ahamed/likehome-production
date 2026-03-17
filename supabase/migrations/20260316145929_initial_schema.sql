drop extension if exists "pg_net";

create sequence "public"."hotels_id_seq";

create sequence "public"."locations_id_seq";


  create table "public"."hotel_searches" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "hotel_id" text not null,
    "hotel_name" text,
    "destination" text,
    "checkin" date,
    "checkout" date,
    "rate_usd" numeric,
    "searched_at" timestamp with time zone default now()
      );


alter table "public"."hotel_searches" enable row level security;


  create table "public"."hotels" (
    "id" integer not null default nextval('public.hotels_id_seq'::regclass),
    "name" character varying(255) not null,
    "description" text,
    "star_rating" numeric(2,1),
    "review_score" numeric(3,2),
    "review_count" integer default 0,
    "floors" integer,
    "total_rooms" integer,
    "check_in_time" time without time zone,
    "check_out_time" time without time zone,
    "min_check_in_age" integer default 18,
    "destination_fee" numeric(10,2),
    "currency" character varying(10) default 'USD'::character varying,
    "location_id" integer,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );


alter table "public"."hotels" enable row level security;


  create table "public"."locations" (
    "id" integer not null default nextval('public.locations_id_seq'::regclass),
    "address_line1" character varying(255) not null,
    "address_line2" character varying(255),
    "city" character varying(100) not null,
    "state" character varying(100),
    "country" character varying(100) not null,
    "postal_code" character varying(20),
    "latitude" numeric(9,6),
    "longitude" numeric(9,6)
      );


alter table "public"."locations" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "reward_points" integer default 0,
    "role" text default 'customer'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;

alter sequence "public"."hotels_id_seq" owned by "public"."hotels"."id";

alter sequence "public"."locations_id_seq" owned by "public"."locations"."id";

CREATE INDEX hotel_searches_destination_idx ON public.hotel_searches USING btree (destination, checkin);

CREATE UNIQUE INDEX hotel_searches_pkey ON public.hotel_searches USING btree (id);

CREATE INDEX hotel_searches_user_idx ON public.hotel_searches USING btree (user_id);

CREATE UNIQUE INDEX hotels_pkey ON public.hotels USING btree (id);

CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."hotel_searches" add constraint "hotel_searches_pkey" PRIMARY KEY using index "hotel_searches_pkey";

alter table "public"."hotels" add constraint "hotels_pkey" PRIMARY KEY using index "hotels_pkey";

alter table "public"."locations" add constraint "locations_pkey" PRIMARY KEY using index "locations_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."hotel_searches" add constraint "hotel_searches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."hotel_searches" validate constraint "hotel_searches_user_id_fkey";

alter table "public"."hotels" add constraint "hotels_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public.locations(id) not valid;

alter table "public"."hotels" validate constraint "hotels_location_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['customer'::text, 'property_owner'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_reward_points(p_user_id uuid, p_points integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.profiles
  SET reward_points = reward_points + p_points
  WHERE id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

grant delete on table "public"."hotel_searches" to "anon";

grant insert on table "public"."hotel_searches" to "anon";

grant references on table "public"."hotel_searches" to "anon";

grant select on table "public"."hotel_searches" to "anon";

grant trigger on table "public"."hotel_searches" to "anon";

grant truncate on table "public"."hotel_searches" to "anon";

grant update on table "public"."hotel_searches" to "anon";

grant delete on table "public"."hotel_searches" to "authenticated";

grant insert on table "public"."hotel_searches" to "authenticated";

grant references on table "public"."hotel_searches" to "authenticated";

grant select on table "public"."hotel_searches" to "authenticated";

grant trigger on table "public"."hotel_searches" to "authenticated";

grant truncate on table "public"."hotel_searches" to "authenticated";

grant update on table "public"."hotel_searches" to "authenticated";

grant delete on table "public"."hotel_searches" to "service_role";

grant insert on table "public"."hotel_searches" to "service_role";

grant references on table "public"."hotel_searches" to "service_role";

grant select on table "public"."hotel_searches" to "service_role";

grant trigger on table "public"."hotel_searches" to "service_role";

grant truncate on table "public"."hotel_searches" to "service_role";

grant update on table "public"."hotel_searches" to "service_role";

grant delete on table "public"."hotels" to "anon";

grant insert on table "public"."hotels" to "anon";

grant references on table "public"."hotels" to "anon";

grant select on table "public"."hotels" to "anon";

grant trigger on table "public"."hotels" to "anon";

grant truncate on table "public"."hotels" to "anon";

grant update on table "public"."hotels" to "anon";

grant delete on table "public"."hotels" to "authenticated";

grant insert on table "public"."hotels" to "authenticated";

grant references on table "public"."hotels" to "authenticated";

grant select on table "public"."hotels" to "authenticated";

grant trigger on table "public"."hotels" to "authenticated";

grant truncate on table "public"."hotels" to "authenticated";

grant update on table "public"."hotels" to "authenticated";

grant delete on table "public"."hotels" to "service_role";

grant insert on table "public"."hotels" to "service_role";

grant references on table "public"."hotels" to "service_role";

grant select on table "public"."hotels" to "service_role";

grant trigger on table "public"."hotels" to "service_role";

grant truncate on table "public"."hotels" to "service_role";

grant update on table "public"."hotels" to "service_role";

grant delete on table "public"."locations" to "anon";

grant insert on table "public"."locations" to "anon";

grant references on table "public"."locations" to "anon";

grant select on table "public"."locations" to "anon";

grant trigger on table "public"."locations" to "anon";

grant truncate on table "public"."locations" to "anon";

grant update on table "public"."locations" to "anon";

grant delete on table "public"."locations" to "authenticated";

grant insert on table "public"."locations" to "authenticated";

grant references on table "public"."locations" to "authenticated";

grant select on table "public"."locations" to "authenticated";

grant trigger on table "public"."locations" to "authenticated";

grant truncate on table "public"."locations" to "authenticated";

grant update on table "public"."locations" to "authenticated";

grant delete on table "public"."locations" to "service_role";

grant insert on table "public"."locations" to "service_role";

grant references on table "public"."locations" to "service_role";

grant select on table "public"."locations" to "service_role";

grant trigger on table "public"."locations" to "service_role";

grant truncate on table "public"."locations" to "service_role";

grant update on table "public"."locations" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "Users can view own searches"
  on "public"."hotel_searches"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Hotels are publicly readable"
  on "public"."hotels"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Locations are publicly readable"
  on "public"."locations"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


