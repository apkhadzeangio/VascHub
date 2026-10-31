import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_centres_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__centres_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_specialists_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__specialists_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "centres" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "slug" varchar,
    "city" varchar,
    "summary" varchar,
    "address" varchar,
    "website" varchar,
    "email" varchar,
    "phone" varchar,
    "image_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_centres_status" DEFAULT 'draft'
  );

  CREATE TABLE "centres_texts" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "text" varchar
  );

  CREATE TABLE "_centres_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar,
    "version_slug" varchar,
    "version_city" varchar,
    "version_summary" varchar,
    "version_address" varchar,
    "version_website" varchar,
    "version_email" varchar,
    "version_phone" varchar,
    "version_image_id" integer,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__centres_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "_centres_v_texts" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "text" varchar
  );

  CREATE TABLE "specialists_professional_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "url" varchar
  );

  CREATE TABLE "specialists" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar,
    "slug" varchar,
    "city" varchar,
    "summary" varchar,
    "photo_id" integer,
    "website" varchar,
    "email" varchar,
    "phone" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_specialists_status" DEFAULT 'draft'
  );

  CREATE TABLE "specialists_texts" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "text" varchar
  );

  CREATE TABLE "specialists_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "centres_id" integer
  );

  CREATE TABLE "_specialists_v_version_professional_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "url" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_specialists_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar,
    "version_slug" varchar,
    "version_city" varchar,
    "version_summary" varchar,
    "version_photo_id" integer,
    "version_website" varchar,
    "version_email" varchar,
    "version_phone" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__specialists_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "_specialists_v_texts" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "text" varchar
  );

  CREATE TABLE "_specialists_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "centres_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "centres_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "specialists_id" integer;
  ALTER TABLE "centres" ADD CONSTRAINT "centres_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "centres_texts" ADD CONSTRAINT "centres_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_centres_v" ADD CONSTRAINT "_centres_v_parent_id_centres_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."centres"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_centres_v" ADD CONSTRAINT "_centres_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_centres_v_texts" ADD CONSTRAINT "_centres_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_centres_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "specialists_professional_links" ADD CONSTRAINT "specialists_professional_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."specialists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "specialists" ADD CONSTRAINT "specialists_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "specialists_texts" ADD CONSTRAINT "specialists_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."specialists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "specialists_rels" ADD CONSTRAINT "specialists_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."specialists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "specialists_rels" ADD CONSTRAINT "specialists_rels_centres_fk" FOREIGN KEY ("centres_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_specialists_v_version_professional_links" ADD CONSTRAINT "_specialists_v_version_professional_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_specialists_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_specialists_v" ADD CONSTRAINT "_specialists_v_parent_id_specialists_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."specialists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_specialists_v" ADD CONSTRAINT "_specialists_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_specialists_v_texts" ADD CONSTRAINT "_specialists_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_specialists_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_specialists_v_rels" ADD CONSTRAINT "_specialists_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_specialists_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_specialists_v_rels" ADD CONSTRAINT "_specialists_v_rels_centres_fk" FOREIGN KEY ("centres_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "centres_name_idx" ON "centres" USING btree ("name");
  CREATE UNIQUE INDEX "centres_slug_idx" ON "centres" USING btree ("slug");
  CREATE INDEX "centres_city_idx" ON "centres" USING btree ("city");
  CREATE INDEX "centres_image_idx" ON "centres" USING btree ("image_id");
  CREATE INDEX "centres_updated_at_idx" ON "centres" USING btree ("updated_at");
  CREATE INDEX "centres_created_at_idx" ON "centres" USING btree ("created_at");
  CREATE INDEX "centres__status_idx" ON "centres" USING btree ("_status");
  CREATE INDEX "centres_texts_order_parent" ON "centres_texts" USING btree ("order","parent_id");
  CREATE INDEX "_centres_v_parent_idx" ON "_centres_v" USING btree ("parent_id");
  CREATE INDEX "_centres_v_version_version_name_idx" ON "_centres_v" USING btree ("version_name");
  CREATE INDEX "_centres_v_version_version_slug_idx" ON "_centres_v" USING btree ("version_slug");
  CREATE INDEX "_centres_v_version_version_city_idx" ON "_centres_v" USING btree ("version_city");
  CREATE INDEX "_centres_v_version_version_image_idx" ON "_centres_v" USING btree ("version_image_id");
  CREATE INDEX "_centres_v_version_version_updated_at_idx" ON "_centres_v" USING btree ("version_updated_at");
  CREATE INDEX "_centres_v_version_version_created_at_idx" ON "_centres_v" USING btree ("version_created_at");
  CREATE INDEX "_centres_v_version_version__status_idx" ON "_centres_v" USING btree ("version__status");
  CREATE INDEX "_centres_v_created_at_idx" ON "_centres_v" USING btree ("created_at");
  CREATE INDEX "_centres_v_updated_at_idx" ON "_centres_v" USING btree ("updated_at");
  CREATE INDEX "_centres_v_latest_idx" ON "_centres_v" USING btree ("latest");
  CREATE INDEX "_centres_v_texts_order_parent" ON "_centres_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "specialists_professional_links_order_idx" ON "specialists_professional_links" USING btree ("_order");
  CREATE INDEX "specialists_professional_links_parent_id_idx" ON "specialists_professional_links" USING btree ("_parent_id");
  CREATE INDEX "specialists_name_idx" ON "specialists" USING btree ("name");
  CREATE UNIQUE INDEX "specialists_slug_idx" ON "specialists" USING btree ("slug");
  CREATE INDEX "specialists_city_idx" ON "specialists" USING btree ("city");
  CREATE INDEX "specialists_photo_idx" ON "specialists" USING btree ("photo_id");
  CREATE INDEX "specialists_updated_at_idx" ON "specialists" USING btree ("updated_at");
  CREATE INDEX "specialists_created_at_idx" ON "specialists" USING btree ("created_at");
  CREATE INDEX "specialists__status_idx" ON "specialists" USING btree ("_status");
  CREATE INDEX "specialists_texts_order_parent" ON "specialists_texts" USING btree ("order","parent_id");
  CREATE INDEX "specialists_texts_text_idx" ON "specialists_texts" USING btree ("text");
  CREATE INDEX "specialists_rels_order_idx" ON "specialists_rels" USING btree ("order");
  CREATE INDEX "specialists_rels_parent_idx" ON "specialists_rels" USING btree ("parent_id");
  CREATE INDEX "specialists_rels_path_idx" ON "specialists_rels" USING btree ("path");
  CREATE INDEX "specialists_rels_centres_id_idx" ON "specialists_rels" USING btree ("centres_id");
  CREATE INDEX "_specialists_v_version_professional_links_order_idx" ON "_specialists_v_version_professional_links" USING btree ("_order");
  CREATE INDEX "_specialists_v_version_professional_links_parent_id_idx" ON "_specialists_v_version_professional_links" USING btree ("_parent_id");
  CREATE INDEX "_specialists_v_parent_idx" ON "_specialists_v" USING btree ("parent_id");
  CREATE INDEX "_specialists_v_version_version_name_idx" ON "_specialists_v" USING btree ("version_name");
  CREATE INDEX "_specialists_v_version_version_slug_idx" ON "_specialists_v" USING btree ("version_slug");
  CREATE INDEX "_specialists_v_version_version_city_idx" ON "_specialists_v" USING btree ("version_city");
  CREATE INDEX "_specialists_v_version_version_photo_idx" ON "_specialists_v" USING btree ("version_photo_id");
  CREATE INDEX "_specialists_v_version_version_updated_at_idx" ON "_specialists_v" USING btree ("version_updated_at");
  CREATE INDEX "_specialists_v_version_version_created_at_idx" ON "_specialists_v" USING btree ("version_created_at");
  CREATE INDEX "_specialists_v_version_version__status_idx" ON "_specialists_v" USING btree ("version__status");
  CREATE INDEX "_specialists_v_created_at_idx" ON "_specialists_v" USING btree ("created_at");
  CREATE INDEX "_specialists_v_updated_at_idx" ON "_specialists_v" USING btree ("updated_at");
  CREATE INDEX "_specialists_v_latest_idx" ON "_specialists_v" USING btree ("latest");
  CREATE INDEX "_specialists_v_texts_order_parent" ON "_specialists_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_specialists_v_rels_order_idx" ON "_specialists_v_rels" USING btree ("order");
  CREATE INDEX "_specialists_v_rels_parent_idx" ON "_specialists_v_rels" USING btree ("parent_id");
  CREATE INDEX "_specialists_v_rels_path_idx" ON "_specialists_v_rels" USING btree ("path");
  CREATE INDEX "_specialists_v_rels_centres_id_idx" ON "_specialists_v_rels" USING btree ("centres_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_centres_fk" FOREIGN KEY ("centres_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_specialists_fk" FOREIGN KEY ("specialists_id") REFERENCES "public"."specialists"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_centres_id_idx" ON "payload_locked_documents_rels" USING btree ("centres_id");
  CREATE INDEX "payload_locked_documents_rels_specialists_id_idx" ON "payload_locked_documents_rels" USING btree ("specialists_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "centres" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "centres_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_centres_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_centres_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "specialists_professional_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "specialists" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "specialists_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "specialists_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_specialists_v_version_professional_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_specialists_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_specialists_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_specialists_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_centres_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_specialists_fk";
  DROP TABLE "centres" CASCADE;
  DROP TABLE "centres_texts" CASCADE;
  DROP TABLE "_centres_v" CASCADE;
  DROP TABLE "_centres_v_texts" CASCADE;
  DROP TABLE "specialists_professional_links" CASCADE;
  DROP TABLE "specialists" CASCADE;
  DROP TABLE "specialists_texts" CASCADE;
  DROP TABLE "specialists_rels" CASCADE;
  DROP TABLE "_specialists_v_version_professional_links" CASCADE;
  DROP TABLE "_specialists_v" CASCADE;
  DROP TABLE "_specialists_v_texts" CASCADE;
  DROP TABLE "_specialists_v_rels" CASCADE;




  DROP INDEX "payload_locked_documents_rels_centres_id_idx";
  DROP INDEX "payload_locked_documents_rels_specialists_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "centres_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "specialists_id";
  DROP TYPE "public"."enum_centres_status";
  DROP TYPE "public"."enum__centres_v_version_status";
  DROP TYPE "public"."enum_specialists_status";
  DROP TYPE "public"."enum__specialists_v_version_status";`)
}
