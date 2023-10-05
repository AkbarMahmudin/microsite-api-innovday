export type PostType = 'post' | 'event' | 'stream';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  UNPUBLISHED = 'unpublished',
  SCHEDULED = 'scheduled',
  PRIVATE = 'private',
  ARCHIVED = 'archived',
}

export interface PostItem {
  thumbnail?: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  tags: string[];
  type: PostType;
  authorId: number;
  publishedAt?: Date;
  categoryId: number;
}
