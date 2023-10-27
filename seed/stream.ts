import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const userStreamId = faker.datatype.number({ min: 1, max: 11 });

const stream = {
  youtubeId: 'nW9AwP-D-WI',
  slidoId: '5x5AFThvqDekyGG4WdRXZd',
  startDate: faker.date.recent(),
  endDate: faker.date.recent(),
  // key: 'gyq71au2' + faker.datatype.number({ min: 1, max: 100 }),
  users: {
    createMany: {
      data: [
        {
          userId: userStreamId,
          role: 'speaker',
        },
        {
          userId: userStreamId === 10 ? userStreamId - 1 : userStreamId + 1,
          role: faker.helpers.arrayElement(['host', 'moderator']),
        },
      ],
    },
  },
};

const createStream = () => ({
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraphs(3),
  thumbnail: 'stream-thumbnail-8531ba2f9fcd2bc73c9a70da101a6572e.png',
  status: faker.helpers.arrayElement([
    'draft',
    'published',
    'scheduled',
    'private',
    'archived',
  ]),
  content: faker.lorem.paragraphs(3),
  publishedAt: faker.date.recent(),
  slug: faker.lorem.slug(),
  categoryId: faker.datatype.number({ min: 1, max: 10 }),
  type: 'stream',
  tags: [...new Set(faker.lorem.words(3).split(' '))],
  authorId: faker.datatype.number({ min: 1, max: 11 }),
  // meta keywords
  metaTitle: faker.lorem.sentence(),
  metaDescription: faker.lorem.sentence(),
  metaKeywords: faker.lorem.words(3),
  // stream
  stream: {
    create: stream,
  },
});

const main = async () => {
  const streams = [];

  for (let i = 0; i < 50; i++) {
    await prisma.post.create({
      data: createStream(),
      include: {
        stream: true,
      },
    });
  }
};

main()
  .catch((err) => console.log(err))
  .finally(async () => await prisma.$disconnect());
