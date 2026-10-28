import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_homepage_topics" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "search_term" varchar
  );

  CREATE TABLE "pages_homepage_events" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "date" timestamp(3) with time zone,
    "location" varchar,
    "url" varchar
  );

  CREATE TABLE "_pages_v_version_homepage_topics" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "search_term" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_version_homepage_events" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "date" timestamp(3) with time zone,
    "location" varchar,
    "url" varchar,
    "_uuid" varchar
  );

  ALTER TABLE "pages" ADD COLUMN "homepage_eyebrow" varchar DEFAULT 'კლინიკური ცოდნა • პროფესიული ერთობა';
  ALTER TABLE "pages" ADD COLUMN "homepage_heading" varchar DEFAULT 'ცოდნა ყოველდღიური პრაქტიკისთვის.';
  ALTER TABLE "pages" ADD COLUMN "homepage_intro" varchar DEFAULT 'გაიდლაინები, სწავლა და პროფესიული შესაძლებლობები ერთ სივრცეში.';
  ALTER TABLE "pages" ADD COLUMN "homepage_academy_heading" varchar DEFAULT 'ისწავლე მოკლე, პრაქტიკული მასალებით.';
  ALTER TABLE "pages" ADD COLUMN "homepage_academy_description" varchar DEFAULT 'გაეცანი გამორჩეულ სასწავლო მასალას და გაიღრმავე ცოდნა.';
  ALTER TABLE "pages" ADD COLUMN "homepage_academy_post_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_homepage_eyebrow" varchar DEFAULT 'კლინიკური ცოდნა • პროფესიული ერთობა';
  ALTER TABLE "_pages_v" ADD COLUMN "version_homepage_heading" varchar DEFAULT 'ცოდნა ყოველდღიური პრაქტიკისთვის.';
  ALTER TABLE "_pages_v" ADD COLUMN "version_homepage_intro" varchar DEFAULT 'გაიდლაინები, სწავლა და პროფესიული შესაძლებლობები ერთ სივრცეში.';
  ALTER TABLE "_pages_v" ADD COLUMN "version_homepage_academy_heading" varchar DEFAULT 'ისწავლე მოკლე, პრაქტიკული მასალებით.';
  ALTER TABLE "_pages_v" ADD COLUMN "version_homepage_academy_description" varchar DEFAULT 'გაეცანი გამორჩეულ სასწავლო მასალას და გაიღრმავე ცოდნა.';
  ALTER TABLE "_pages_v" ADD COLUMN "version_homepage_academy_post_id" integer;
  ALTER TABLE "pages_homepage_topics" ADD CONSTRAINT "pages_homepage_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_homepage_events" ADD CONSTRAINT "pages_homepage_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_homepage_topics" ADD CONSTRAINT "_pages_v_version_homepage_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_homepage_events" ADD CONSTRAINT "_pages_v_version_homepage_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_homepage_topics_order_idx" ON "pages_homepage_topics" USING btree ("_order");
  CREATE INDEX "pages_homepage_topics_parent_id_idx" ON "pages_homepage_topics" USING btree ("_parent_id");
  CREATE INDEX "pages_homepage_events_order_idx" ON "pages_homepage_events" USING btree ("_order");
  CREATE INDEX "pages_homepage_events_parent_id_idx" ON "pages_homepage_events" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_homepage_topics_order_idx" ON "_pages_v_version_homepage_topics" USING btree ("_order");
  CREATE INDEX "_pages_v_version_homepage_topics_parent_id_idx" ON "_pages_v_version_homepage_topics" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_homepage_events_order_idx" ON "_pages_v_version_homepage_events" USING btree ("_order");
  CREATE INDEX "_pages_v_version_homepage_events_parent_id_idx" ON "_pages_v_version_homepage_events" USING btree ("_parent_id");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_homepage_academy_post_id_posts_id_fk" FOREIGN KEY ("homepage_academy_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_homepage_academy_post_id_posts_id_fk" FOREIGN KEY ("version_homepage_academy_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_homepage_academy_homepage_academy_post_idx" ON "pages" USING btree ("homepage_academy_post_id");
  CREATE INDEX "_pages_v_version_homepage_academy_version_homepage_acade_idx" ON "_pages_v" USING btree ("version_homepage_academy_post_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_homepage_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_homepage_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_version_homepage_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_version_homepage_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_homepage_topics" CASCADE;
  DROP TABLE "pages_homepage_events" CASCADE;
  DROP TABLE "_pages_v_version_homepage_topics" CASCADE;
  DROP TABLE "_pages_v_version_homepage_events" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_homepage_academy_post_id_posts_id_fk";

  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_homepage_academy_post_id_posts_id_fk";

  DROP INDEX "pages_homepage_academy_homepage_academy_post_idx";
  DROP INDEX "_pages_v_version_homepage_academy_version_homepage_acade_idx";
  ALTER TABLE "pages" DROP COLUMN "homepage_eyebrow";
  ALTER TABLE "pages" DROP COLUMN "homepage_heading";
  ALTER TABLE "pages" DROP COLUMN "homepage_intro";
  ALTER TABLE "pages" DROP COLUMN "homepage_academy_heading";
  ALTER TABLE "pages" DROP COLUMN "homepage_academy_description";
  ALTER TABLE "pages" DROP COLUMN "homepage_academy_post_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_homepage_eyebrow";
  ALTER TABLE "_pages_v" DROP COLUMN "version_homepage_heading";
  ALTER TABLE "_pages_v" DROP COLUMN "version_homepage_intro";
  ALTER TABLE "_pages_v" DROP COLUMN "version_homepage_academy_heading";
  ALTER TABLE "_pages_v" DROP COLUMN "version_homepage_academy_description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_homepage_academy_post_id";`)
}
