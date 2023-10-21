import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const createCategory = () => ({
  name: faker.helpers.arrayElement([
    'Technology',
    'Programming',
    'Lifestyle',
    'Health',
    'Business',
    'Finance',
    'Travel',
    'Food',
    'Education',
    'Sports',
    'Entertainment',
    'News',
    'Politics',
    'Science',
    'Marketing',
    'Social Media',
    'E-commerce',
  ]),
  slug: faker.lorem.slug(),
});

const main = async () => {
  const categories = [];

  for (let i = 0; i < 10; i++) {
    categories.push(createCategory());
  }

  await prisma.category.createMany({
    data: categories,
  });
};

main()
  .catch((err) => console.log(err))
  .finally(async () => await prisma.$disconnect());
