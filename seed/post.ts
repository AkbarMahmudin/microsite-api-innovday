import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

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
});

const main = async () => {
  const posts = [];

  for (let i = 0; i < 10; i++) {
    posts.push(createPost());
  }

  await prisma.post.createMany({
    data: posts,
  });
};

main()
  .catch((err) => console.log(err))
  .finally(async () => await prisma.$disconnect());
