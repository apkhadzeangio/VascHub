import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_library_resources_resource_type" AS ENUM('guideline', 'publication', 'georgian', 'education', 'presentation');
  CREATE TYPE "public"."enum_library_resources_language" AS ENUM('ka', 'en', 'ru', 'other');
  CREATE TYPE "public"."enum_library_resources_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__library_resources_v_version_resource_type" AS ENUM('guideline', 'publication', 'georgian', 'education', 'presentation');
  CREATE TYPE "public"."enum__library_resources_v_version_language" AS ENUM('ka', 'en', 'ru', 'other');
  CREATE TYPE "public"."enum__library_resources_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "library_files" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "rights_confirmed" boolean DEFAULT false NOT NULL,
    "rights_note" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric
  );

  CREATE TABLE "library_resources" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "description" varchar,
    "resource_type" "enum_library_resources_resource_type",
    "authors" varchar,
    "year" numeric,
    "version" varchar,
    "resource_updated_at" timestamp(3) with time zone,
    "language" "enum_library_resources_language" DEFAULT 'en',
    "keywords" varchar,
    "doi" varchar,
    "source_url" varchar,
    "pdf_id" integer,
    "meta_title" varchar,
    "meta_description" varchar,
    "generate_slug" boolean DEFAULT true,
    "slug" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_library_resources_status" DEFAULT 'draft'
  );

  CREATE TABLE "library_resources_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" integer
  );

  CREATE TABLE "_library_resources_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_description" varchar,
    "version_resource_type" "enum__library_resources_v_version_resource_type",
    "version_authors" varchar,
    "version_year" numeric,
    "version_version" varchar,
    "version_resource_updated_at" timestamp(3) with time zone,
    "version_language" "enum__library_resources_v_version_language" DEFAULT 'en',
    "version_keywords" varchar,
    "version_doi" varchar,
    "version_source_url" varchar,
    "version_pdf_id" integer,
    "version_meta_title" varchar,
    "version_meta_description" varchar,
    "version_generate_slug" boolean DEFAULT true,
    "version_slug" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__library_resources_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "_library_resources_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "categories_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_files_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_resources_id" integer;
  ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_pdf_id_library_files_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."library_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_parent_id_library_resources_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_version_pdf_id_library_files_id_fk" FOREIGN KEY ("version_pdf_id") REFERENCES "public"."library_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_library_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "library_files_updated_at_idx" ON "library_files" USING btree ("updated_at");
  CREATE INDEX "library_files_created_at_idx" ON "library_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "library_files_filename_idx" ON "library_files" USING btree ("filename");
  CREATE INDEX "library_resources_resource_type_idx" ON "library_resources" USING btree ("resource_type");
  CREATE INDEX "library_resources_year_idx" ON "library_resources" USING btree ("year");
  CREATE INDEX "library_resources_language_idx" ON "library_resources" USING btree ("language");
  CREATE INDEX "library_resources_pdf_idx" ON "library_resources" USING btree ("pdf_id");
  CREATE UNIQUE INDEX "library_resources_slug_idx" ON "library_resources" USING btree ("slug");
  CREATE INDEX "library_resources_updated_at_idx" ON "library_resources" USING btree ("updated_at");
  CREATE INDEX "library_resources_created_at_idx" ON "library_resources" USING btree ("created_at");
  CREATE INDEX "library_resources__status_idx" ON "library_resources" USING btree ("_status");
  CREATE INDEX "library_resources_rels_order_idx" ON "library_resources_rels" USING btree ("order");
  CREATE INDEX "library_resources_rels_parent_idx" ON "library_resources_rels" USING btree ("parent_id");
  CREATE INDEX "library_resources_rels_path_idx" ON "library_resources_rels" USING btree ("path");
  CREATE INDEX "library_resources_rels_categories_id_idx" ON "library_resources_rels" USING btree ("categories_id");
  CREATE INDEX "_library_resources_v_parent_idx" ON "_library_resources_v" USING btree ("parent_id");
  CREATE INDEX "_library_resources_v_version_version_resource_type_idx" ON "_library_resources_v" USING btree ("version_resource_type");
  CREATE INDEX "_library_resources_v_version_version_year_idx" ON "_library_resources_v" USING btree ("version_year");
  CREATE INDEX "_library_resources_v_version_version_language_idx" ON "_library_resources_v" USING btree ("version_language");
  CREATE INDEX "_library_resources_v_version_version_pdf_idx" ON "_library_resources_v" USING btree ("version_pdf_id");
  CREATE INDEX "_library_resources_v_version_version_slug_idx" ON "_library_resources_v" USING btree ("version_slug");
  CREATE INDEX "_library_resources_v_version_version_updated_at_idx" ON "_library_resources_v" USING btree ("version_updated_at");
  CREATE INDEX "_library_resources_v_version_version_created_at_idx" ON "_library_resources_v" USING btree ("version_created_at");
  CREATE INDEX "_library_resources_v_version_version__status_idx" ON "_library_resources_v" USING btree ("version__status");
  CREATE INDEX "_library_resources_v_created_at_idx" ON "_library_resources_v" USING btree ("created_at");
  CREATE INDEX "_library_resources_v_updated_at_idx" ON "_library_resources_v" USING btree ("updated_at");
  CREATE INDEX "_library_resources_v_latest_idx" ON "_library_resources_v" USING btree ("latest");
  CREATE INDEX "_library_resources_v_rels_order_idx" ON "_library_resources_v_rels" USING btree ("order");
  CREATE INDEX "_library_resources_v_rels_parent_idx" ON "_library_resources_v_rels" USING btree ("parent_id");
  CREATE INDEX "_library_resources_v_rels_path_idx" ON "_library_resources_v_rels" USING btree ("path");
  CREATE INDEX "_library_resources_v_rels_categories_id_idx" ON "_library_resources_v_rels" USING btree ("categories_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_files_fk" FOREIGN KEY ("library_files_id") REFERENCES "public"."library_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_resources_fk" FOREIGN KEY ("library_resources_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_library_files_id_idx" ON "payload_locked_documents_rels" USING btree ("library_files_id");
  CREATE INDEX "payload_locked_documents_rels_library_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("library_resources_id");`)
  // Only taxonomy is seeded, never clinical publications or copyrighted documents.
  for (const [slug, title] of [
    ['aorta', 'აორტა'],
    ['carotid', 'კაროტიდული არტერიები'],
    ['peripheral-arterial-disease', 'პერიფერიული არტერიული დაავადება'],
    ['venous-disease', 'ვენური პათოლოგიები'],
    ['dialysis-access', 'დიალიზის სისხლძარღვოვანი წვდომა'],
    ['vascular-trauma', 'სისხლძარღვთა ტრავმა'],
    ['other', 'სხვა'],
  ]) {
    const existing = await payload.find({
      collection: 'categories',
      where: { or: [{ slug: { equals: slug } }, { title: { equals: title } }] },
      limit: 1,
      depth: 0,
      req,
    })
    if (!existing.totalDocs)
      await payload.create({ collection: 'categories', data: { title, slug }, req })
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_library_files_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_library_resources_fk";
  ALTER TABLE "library_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_resources_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "library_files" CASCADE;
  DROP TABLE "library_resources" CASCADE;
  DROP TABLE "library_resources_rels" CASCADE;
  DROP TABLE "_library_resources_v" CASCADE;
  DROP TABLE "_library_resources_v_rels" CASCADE;
  DROP INDEX "payload_locked_documents_rels_library_files_id_idx";
  DROP INDEX "payload_locked_documents_rels_library_resources_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_files_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_resources_id";
  DROP TYPE "public"."enum_library_resources_resource_type";
  DROP TYPE "public"."enum_library_resources_language";
  DROP TYPE "public"."enum_library_resources_status";
  DROP TYPE "public"."enum__library_resources_v_version_resource_type";
  DROP TYPE "public"."enum__library_resources_v_version_language";
  DROP TYPE "public"."enum__library_resources_v_version_status";`)
}
