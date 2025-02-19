CREATE TABLE "reference_data_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference_data_type_schemas" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_data_type_id" integer NOT NULL,
	"name" text NOT NULL,
	"data_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference_data_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reference_data_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_dataset_id" integer NOT NULL,
	"target_dataset_id" integer NOT NULL,
	"relationship_type" text NOT NULL,
	"cardinality" text NOT NULL,
	"source_field" text NOT NULL,
	"target_field" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"routes" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"require_password_change" boolean DEFAULT false NOT NULL,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "reference_data_sets" ADD CONSTRAINT "reference_data_sets_type_id_reference_data_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."reference_data_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_data_type_schemas" ADD CONSTRAINT "reference_data_type_schemas_reference_data_type_id_reference_data_types_id_fk" FOREIGN KEY ("reference_data_type_id") REFERENCES "public"."reference_data_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_source_dataset_id_reference_data_sets_id_fk" FOREIGN KEY ("source_dataset_id") REFERENCES "public"."reference_data_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_target_dataset_id_reference_data_sets_id_fk" FOREIGN KEY ("target_dataset_id") REFERENCES "public"."reference_data_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;