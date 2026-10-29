import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_library_resources_language" AS ENUM('ka', 'en', 'ru', 'other');
  CREATE TYPE "public"."enum_library_resources_edition_status" AS ENUM('not-assessed', 'original', 'updated', 'superseded');
  CREATE TYPE "public"."enum_library_resources_attachment_type" AS ENUM('none', 'pdf');
  CREATE TYPE "public"."enum_library_resources_access_type" AS ENUM('external', 'hosted');
  CREATE TYPE "public"."enum_library_resources_license_status" AS ENUM('external-only', 'unverified', 'open-license', 'permission-granted', 'owned');
  CREATE TYPE "public"."enum_library_resources_visibility" AS ENUM('public', 'internal');
  CREATE TYPE "public"."enum_library_resources_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__library_resources_v_version_language" AS ENUM('ka', 'en', 'ru', 'other');
  CREATE TYPE "public"."enum__library_resources_v_version_edition_status" AS ENUM('not-assessed', 'original', 'updated', 'superseded');
  CREATE TYPE "public"."enum__library_resources_v_version_attachment_type" AS ENUM('none', 'pdf');
  CREATE TYPE "public"."enum__library_resources_v_version_access_type" AS ENUM('external', 'hosted');
  CREATE TYPE "public"."enum__library_resources_v_version_license_status" AS ENUM('external-only', 'unverified', 'open-license', 'permission-granted', 'owned');
  CREATE TYPE "public"."enum__library_resources_v_version_visibility" AS ENUM('public', 'internal');
  CREATE TYPE "public"."enum__library_resources_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "library_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"abbreviation" varchar,
  	"official_url" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "library_document_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"abbreviation" varchar,
  	"official_url" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "library_organizations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"abbreviation" varchar,
  	"official_url" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
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
  	"original_title" varchar,
  	"summary" varchar,
  	"description" varchar,
  	"document_type_id" integer,
  	"publisher_organization_id" integer,
  	"language" "enum_library_resources_language" DEFAULT 'en',
  	"publication_year" numeric,
  	"publication_date" timestamp(3) with time zone,
  	"official_source_url" varchar,
  	"doi" varchar,
  	"pmid" varchar,
  	"authors" varchar,
  	"journal" varchar,
  	"citation_text" varchar,
  	"version_label" varchar,
  	"edition_status" "enum_library_resources_edition_status" DEFAULT 'not-assessed',
  	"superseded_by_id" integer,
  	"update_evidence_url" varchar,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"attachment_id" integer,
  	"attachment_type" "enum_library_resources_attachment_type" DEFAULT 'none',
  	"access_type" "enum_library_resources_access_type" DEFAULT 'external',
  	"license_status" "enum_library_resources_license_status" DEFAULT 'external-only',
  	"rights_evidence" varchar,
  	"copyright_notice" varchar,
  	"visibility" "enum_library_resources_visibility" DEFAULT 'public',
  	"featured" boolean DEFAULT false,
  	"search_keywords" varchar,
  	"import_key" varchar,
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
  	"library_topics_id" integer,
  	"library_resources_id" integer
  );
  
  CREATE TABLE "_library_resources_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_original_title" varchar,
  	"version_summary" varchar,
  	"version_description" varchar,
  	"version_document_type_id" integer,
  	"version_publisher_organization_id" integer,
  	"version_language" "enum__library_resources_v_version_language" DEFAULT 'en',
  	"version_publication_year" numeric,
  	"version_publication_date" timestamp(3) with time zone,
  	"version_official_source_url" varchar,
  	"version_doi" varchar,
  	"version_pmid" varchar,
  	"version_authors" varchar,
  	"version_journal" varchar,
  	"version_citation_text" varchar,
  	"version_version_label" varchar,
  	"version_edition_status" "enum__library_resources_v_version_edition_status" DEFAULT 'not-assessed',
  	"version_superseded_by_id" integer,
  	"version_update_evidence_url" varchar,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_attachment_id" integer,
  	"version_attachment_type" "enum__library_resources_v_version_attachment_type" DEFAULT 'none',
  	"version_access_type" "enum__library_resources_v_version_access_type" DEFAULT 'external',
  	"version_license_status" "enum__library_resources_v_version_license_status" DEFAULT 'external-only',
  	"version_rights_evidence" varchar,
  	"version_copyright_notice" varchar,
  	"version_visibility" "enum__library_resources_v_version_visibility" DEFAULT 'public',
  	"version_featured" boolean DEFAULT false,
  	"version_search_keywords" varchar,
  	"version_import_key" varchar,
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
  	"library_topics_id" integer,
  	"library_resources_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_topics_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_document_types_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_organizations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_files_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_resources_id" integer;
  ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_document_type_id_library_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."library_document_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_publisher_organization_id_library_organizations_id_fk" FOREIGN KEY ("publisher_organization_id") REFERENCES "public"."library_organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_superseded_by_id_library_resources_id_fk" FOREIGN KEY ("superseded_by_id") REFERENCES "public"."library_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_attachment_id_library_files_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."library_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_library_topics_fk" FOREIGN KEY ("library_topics_id") REFERENCES "public"."library_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "library_resources_rels" ADD CONSTRAINT "library_resources_rels_library_resources_fk" FOREIGN KEY ("library_resources_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_parent_id_library_resources_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."library_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_version_document_type_id_library_document_types_id_fk" FOREIGN KEY ("version_document_type_id") REFERENCES "public"."library_document_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_version_publisher_organization_id_library_organizations_id_fk" FOREIGN KEY ("version_publisher_organization_id") REFERENCES "public"."library_organizations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_version_superseded_by_id_library_resources_id_fk" FOREIGN KEY ("version_superseded_by_id") REFERENCES "public"."library_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v" ADD CONSTRAINT "_library_resources_v_version_attachment_id_library_files_id_fk" FOREIGN KEY ("version_attachment_id") REFERENCES "public"."library_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_library_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_library_topics_fk" FOREIGN KEY ("library_topics_id") REFERENCES "public"."library_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_library_resources_v_rels" ADD CONSTRAINT "_library_resources_v_rels_library_resources_fk" FOREIGN KEY ("library_resources_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "library_topics_abbreviation_idx" ON "library_topics" USING btree ("abbreviation");
  CREATE UNIQUE INDEX "library_topics_slug_idx" ON "library_topics" USING btree ("slug");
  CREATE INDEX "library_topics_updated_at_idx" ON "library_topics" USING btree ("updated_at");
  CREATE INDEX "library_topics_created_at_idx" ON "library_topics" USING btree ("created_at");
  CREATE INDEX "library_document_types_abbreviation_idx" ON "library_document_types" USING btree ("abbreviation");
  CREATE UNIQUE INDEX "library_document_types_slug_idx" ON "library_document_types" USING btree ("slug");
  CREATE INDEX "library_document_types_updated_at_idx" ON "library_document_types" USING btree ("updated_at");
  CREATE INDEX "library_document_types_created_at_idx" ON "library_document_types" USING btree ("created_at");
  CREATE INDEX "library_organizations_abbreviation_idx" ON "library_organizations" USING btree ("abbreviation");
  CREATE UNIQUE INDEX "library_organizations_slug_idx" ON "library_organizations" USING btree ("slug");
  CREATE INDEX "library_organizations_updated_at_idx" ON "library_organizations" USING btree ("updated_at");
  CREATE INDEX "library_organizations_created_at_idx" ON "library_organizations" USING btree ("created_at");
  CREATE INDEX "library_files_updated_at_idx" ON "library_files" USING btree ("updated_at");
  CREATE INDEX "library_files_created_at_idx" ON "library_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "library_files_filename_idx" ON "library_files" USING btree ("filename");
  CREATE INDEX "library_resources_title_idx" ON "library_resources" USING btree ("title");
  CREATE INDEX "library_resources_original_title_idx" ON "library_resources" USING btree ("original_title");
  CREATE INDEX "library_resources_document_type_idx" ON "library_resources" USING btree ("document_type_id");
  CREATE INDEX "library_resources_publisher_organization_idx" ON "library_resources" USING btree ("publisher_organization_id");
  CREATE INDEX "library_resources_language_idx" ON "library_resources" USING btree ("language");
  CREATE INDEX "library_resources_publication_year_idx" ON "library_resources" USING btree ("publication_year");
  CREATE INDEX "library_resources_superseded_by_idx" ON "library_resources" USING btree ("superseded_by_id");
  CREATE INDEX "library_resources_attachment_idx" ON "library_resources" USING btree ("attachment_id");
  CREATE INDEX "library_resources_visibility_idx" ON "library_resources" USING btree ("visibility");
  CREATE INDEX "library_resources_featured_idx" ON "library_resources" USING btree ("featured");
  CREATE UNIQUE INDEX "library_resources_import_key_idx" ON "library_resources" USING btree ("import_key");
  CREATE UNIQUE INDEX "library_resources_slug_idx" ON "library_resources" USING btree ("slug");
  CREATE INDEX "library_resources_updated_at_idx" ON "library_resources" USING btree ("updated_at");
  CREATE INDEX "library_resources_created_at_idx" ON "library_resources" USING btree ("created_at");
  CREATE INDEX "library_resources__status_idx" ON "library_resources" USING btree ("_status");
  CREATE INDEX "library_resources_rels_order_idx" ON "library_resources_rels" USING btree ("order");
  CREATE INDEX "library_resources_rels_parent_idx" ON "library_resources_rels" USING btree ("parent_id");
  CREATE INDEX "library_resources_rels_path_idx" ON "library_resources_rels" USING btree ("path");
  CREATE INDEX "library_resources_rels_library_topics_id_idx" ON "library_resources_rels" USING btree ("library_topics_id");
  CREATE INDEX "library_resources_rels_library_resources_id_idx" ON "library_resources_rels" USING btree ("library_resources_id");
  CREATE INDEX "_library_resources_v_parent_idx" ON "_library_resources_v" USING btree ("parent_id");
  CREATE INDEX "_library_resources_v_version_version_title_idx" ON "_library_resources_v" USING btree ("version_title");
  CREATE INDEX "_library_resources_v_version_version_original_title_idx" ON "_library_resources_v" USING btree ("version_original_title");
  CREATE INDEX "_library_resources_v_version_version_document_type_idx" ON "_library_resources_v" USING btree ("version_document_type_id");
  CREATE INDEX "_library_resources_v_version_version_publisher_organizat_idx" ON "_library_resources_v" USING btree ("version_publisher_organization_id");
  CREATE INDEX "_library_resources_v_version_version_language_idx" ON "_library_resources_v" USING btree ("version_language");
  CREATE INDEX "_library_resources_v_version_version_publication_year_idx" ON "_library_resources_v" USING btree ("version_publication_year");
  CREATE INDEX "_library_resources_v_version_version_superseded_by_idx" ON "_library_resources_v" USING btree ("version_superseded_by_id");
  CREATE INDEX "_library_resources_v_version_version_attachment_idx" ON "_library_resources_v" USING btree ("version_attachment_id");
  CREATE INDEX "_library_resources_v_version_version_visibility_idx" ON "_library_resources_v" USING btree ("version_visibility");
  CREATE INDEX "_library_resources_v_version_version_featured_idx" ON "_library_resources_v" USING btree ("version_featured");
  CREATE INDEX "_library_resources_v_version_version_import_key_idx" ON "_library_resources_v" USING btree ("version_import_key");
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
  CREATE INDEX "_library_resources_v_rels_library_topics_id_idx" ON "_library_resources_v_rels" USING btree ("library_topics_id");
  CREATE INDEX "_library_resources_v_rels_library_resources_id_idx" ON "_library_resources_v_rels" USING btree ("library_resources_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_topics_fk" FOREIGN KEY ("library_topics_id") REFERENCES "public"."library_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_document_types_fk" FOREIGN KEY ("library_document_types_id") REFERENCES "public"."library_document_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_organizations_fk" FOREIGN KEY ("library_organizations_id") REFERENCES "public"."library_organizations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_files_fk" FOREIGN KEY ("library_files_id") REFERENCES "public"."library_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_resources_fk" FOREIGN KEY ("library_resources_id") REFERENCES "public"."library_resources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_library_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("library_topics_id");
  CREATE INDEX "payload_locked_documents_rels_library_document_types_id_idx" ON "payload_locked_documents_rels" USING btree ("library_document_types_id");
  CREATE INDEX "payload_locked_documents_rels_library_organizations_id_idx" ON "payload_locked_documents_rels" USING btree ("library_organizations_id");
  CREATE INDEX "payload_locked_documents_rels_library_files_id_idx" ON "payload_locked_documents_rels" USING btree ("library_files_id");
  CREATE INDEX "payload_locked_documents_rels_library_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("library_resources_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "library_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_document_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_organizations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "library_resources_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_library_resources_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "library_topics" CASCADE;
  DROP TABLE "library_document_types" CASCADE;
  DROP TABLE "library_organizations" CASCADE;
  DROP TABLE "library_files" CASCADE;
  DROP TABLE "library_resources" CASCADE;
  DROP TABLE "library_resources_rels" CASCADE;
  DROP TABLE "_library_resources_v" CASCADE;
  DROP TABLE "_library_resources_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_library_topics_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_library_document_types_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_library_organizations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_library_files_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_library_resources_fk";
  
  DROP INDEX "payload_locked_documents_rels_library_topics_id_idx";
  DROP INDEX "payload_locked_documents_rels_library_document_types_id_idx";
  DROP INDEX "payload_locked_documents_rels_library_organizations_id_idx";
  DROP INDEX "payload_locked_documents_rels_library_files_id_idx";
  DROP INDEX "payload_locked_documents_rels_library_resources_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_topics_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_document_types_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_organizations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_files_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_resources_id";
  DROP TYPE "public"."enum_library_resources_language";
  DROP TYPE "public"."enum_library_resources_edition_status";
  DROP TYPE "public"."enum_library_resources_attachment_type";
  DROP TYPE "public"."enum_library_resources_access_type";
  DROP TYPE "public"."enum_library_resources_license_status";
  DROP TYPE "public"."enum_library_resources_visibility";
  DROP TYPE "public"."enum_library_resources_status";
  DROP TYPE "public"."enum__library_resources_v_version_language";
  DROP TYPE "public"."enum__library_resources_v_version_edition_status";
  DROP TYPE "public"."enum__library_resources_v_version_attachment_type";
  DROP TYPE "public"."enum__library_resources_v_version_access_type";
  DROP TYPE "public"."enum__library_resources_v_version_license_status";
  DROP TYPE "public"."enum__library_resources_v_version_visibility";
  DROP TYPE "public"."enum__library_resources_v_version_status";`)
}
