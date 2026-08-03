import { pgTable, serial, text, timestamp, primaryKey, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postTypes = pgTable("post_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Products"
  slug: text("slug").notNull().unique(), // e.g., "product"
  icon: text("icon"), // Lucide icon name, e.g., "Database", "Box"
  schema: jsonb("schema"), // JSON array defining custom fields: [{ name: "price", type: "number" }]
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  status: text("status").default("draft").notNull(),
  postTypeId: integer("post_type_id").references(() => postTypes.id),
  meta: jsonb("meta"), // Dynamic data matching the postType schema
  authorId: serial("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postRevisions = pgTable("post_revisions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  meta: jsonb("meta"), // Snapshot of custom fields
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  status: text("status").default("draft").notNull(),
  authorId: serial("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const postCategories = pgTable("post_categories", {
  postId: integer("post_id").references(() => posts.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.categoryId] }),
}));

export const postTags = pgTable("post_tags", {
  postId: integer("post_id").references(() => posts.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.postId, t.tagId] }),
}));

export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  menuId: integer("menu_id").references(() => menus.id).notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  parentId: integer("parent_id"), // For nested menus
  order: integer("order").default(0).notNull(),
});

export const mediaFolders = pgTable("media_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"), // Self-referencing for nested folders
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  altText: text("alt_text"),
  sizes: jsonb("sizes"),
  driver: text("driver"), // Tracks which storage adapter uploaded this (local, cloudinary, s3, etc)
  folderId: integer("folder_id").references(() => mediaFolders.id),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
