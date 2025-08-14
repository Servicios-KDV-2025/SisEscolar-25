import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_header_nav_items_submenu_link_type" AS ENUM('reference', 'custom');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum_header_nav_items_button_style" AS ENUM('default', 'secondary', 'outline', 'ghost', 'link', 'destructive');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
  CREATE TABLE IF NOT EXISTS "pages_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "header_nav_items_submenu" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_nav_items_submenu_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'pages_blocks_text') THEN
      ALTER TABLE "pages_blocks_text" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = '_pages_v_blocks_text') THEN
      ALTER TABLE "_pages_v_blocks_text" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'site_config') THEN
      ALTER TABLE "site_config" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DROP TABLE IF EXISTS "pages_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "site_config" CASCADE;
  DROP INDEX IF EXISTS "redirects_from_idx";
  DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'header_nav_items' AND column_name = 'is_button') THEN
      ALTER TABLE "header_nav_items" ADD COLUMN "is_button" boolean DEFAULT false;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'header_nav_items' AND column_name = 'button_style') THEN
      ALTER TABLE "header_nav_items" ADD COLUMN "button_style" "enum_header_nav_items_button_style";
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pages_blocks_text_block_parent_id_fk') THEN
      ALTER TABLE "pages_blocks_text_block" ADD CONSTRAINT "pages_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_pages_v_blocks_text_block_parent_id_fk') THEN
      ALTER TABLE "_pages_v_blocks_text_block" ADD CONSTRAINT "_pages_v_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'header_nav_items_submenu_parent_id_fk') THEN
      ALTER TABLE "header_nav_items_submenu" ADD CONSTRAINT "header_nav_items_submenu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "pages_blocks_text_block_order_idx" ON "pages_blocks_text_block" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_text_block_parent_id_idx" ON "pages_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_text_block_path_idx" ON "pages_blocks_text_block" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_text_block_order_idx" ON "_pages_v_blocks_text_block" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_text_block_parent_id_idx" ON "_pages_v_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_text_block_path_idx" ON "_pages_v_blocks_text_block" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "header_nav_items_submenu_order_idx" ON "header_nav_items_submenu" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "header_nav_items_submenu_parent_id_idx" ON "header_nav_items_submenu" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "redirects_from_idx" ON "redirects" USING btree ("from");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_background_color" varchar DEFAULT '#ffffff',
  	"footer_background_color" varchar DEFAULT '#f5f5f5',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'pages_blocks_text_block') THEN
      ALTER TABLE "pages_blocks_text_block" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = '_pages_v_blocks_text_block') THEN
      ALTER TABLE "_pages_v_blocks_text_block" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'header_nav_items_submenu') THEN
      ALTER TABLE "header_nav_items_submenu" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DROP TABLE IF EXISTS "pages_blocks_text_block" CASCADE;
  DROP TABLE IF EXISTS "_pages_v_blocks_text_block" CASCADE;
  DROP TABLE IF EXISTS "header_nav_items_submenu" CASCADE;
  DROP INDEX IF EXISTS "redirects_from_idx";
  DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pages_blocks_text_parent_id_fk') THEN
      ALTER TABLE "pages_blocks_text" ADD CONSTRAINT "pages_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_pages_v_blocks_text_parent_id_fk') THEN
      ALTER TABLE "_pages_v_blocks_text" ADD CONSTRAINT "_pages_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "pages_blocks_text_order_idx" ON "pages_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_text_parent_id_idx" ON "pages_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_text_path_idx" ON "pages_blocks_text" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_text_order_idx" ON "_pages_v_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_text_parent_id_idx" ON "_pages_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_text_path_idx" ON "_pages_v_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "redirects_from_idx" ON "redirects" USING btree ("from");
  DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'header_nav_items' AND column_name = 'is_button') THEN
      ALTER TABLE "header_nav_items" DROP COLUMN "is_button";
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'header_nav_items' AND column_name = 'button_style') THEN
      ALTER TABLE "header_nav_items" DROP COLUMN "button_style";
    END IF;
  END $$;
  DROP TYPE IF EXISTS "public"."enum_header_nav_items_submenu_link_type";
  DROP TYPE IF EXISTS "public"."enum_header_nav_items_button_style";`)
}
