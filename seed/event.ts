import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Innovation Day',
    slug: 'innovation-day',
  },
  {
    name: 'InTalks',
    slug: 'intalks',
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
  categoryId: faker.datatype.number({ min: 4, max: 5 }),
  authorId: faker.datatype.number({ min: 1, max: 11 }),
  type: 'event',
  keyPost: null,
});

const main = async () => {
  const events = [];

  for (let i = 0; i < 50; i++) {
    const event = createPost();
    event.keyPost =
      event.status === 'private' ? Math.random().toString(36).slice(-8) : null;
    events.push(event);
  }

  await prisma.$transaction([
    prisma.category.createMany({
      data: categories,
    }),
    prisma.post.createMany({
      data: events,
    }),
  ]);
};

main()
  .catch((err) => console.log(err))
  .finally(async () => await prisma.$disconnect());
