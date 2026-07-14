export const samplePost = {
  id: '00000000-0000-0000-0000-000000000100',
  title: 'Test Post',
  slug: 'test-post',
  content: 'This is a test post content',
  excerpt: 'Test excerpt',
  coverImage: null,
  status: 'DRAFT',
  authorId: '00000000-0000-0000-0000-000000000001',
  categoryId: null,
  publishedAt: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const publishedPost = {
  ...samplePost,
  id: '00000000-0000-0000-0000-000000000101',
  title: 'Published Post',
  slug: 'published-post',
  status: 'PUBLISHED',
  publishedAt: new Date(),
}
