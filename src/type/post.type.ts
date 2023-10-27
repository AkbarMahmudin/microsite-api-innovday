export type PostType = 'post' | 'event' | 'stream';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  PRIVATE = 'private',
  ARCHIVED = 'archived',
}

export interface PostItem {
  thumbnail?: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  status: PostStatus;
  tags: string[];
  type: PostType;
  authorId: number;
  publishedAt?: Date;
  categoryId: number;

  // Metadata for SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}
