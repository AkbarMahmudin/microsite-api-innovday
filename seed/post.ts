import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Technology',
    slug: 'technology',
  },
  {
    name: 'Programming',
    slug: 'programming',
  },
  {
    name: 'Lifestyle',
    slug: 'lifestyle',
  },
];

const createPost = () => ({
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(3),
  status: faker.helpers.arrayElement([
    'draft',
    'published',
    'unpublished',
    'scheduled',
    'private',
    'archived',
  ]),
  publishedAt: faker.date.recent(),
  slug: faker.lorem.slug(),
  categoryId: faker.datatype.number({ min: 1, max: 3 }),
  authorId: faker.datatype.number({ min: 1, max: 11 }),
});

const main = async () => {
  const posts = [];

  for (let i = 0; i < 100; i++) {
    posts.push(createPost());
  }

  await prisma.$transaction([
    prisma.category.createMany({
      data: categories,
    }),
    prisma.post.createMany({
      data: posts,
    }),
  ]);
};

main()
  .catch((err) => console.log(err))
  .finally(async () => await prisma.$disconnect());
