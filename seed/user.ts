import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const roles = [
  {
    name: 'admin',
  },
  {
    name: 'author',
  },
  {
    name: 'speaker',
  },
  {
    name: 'user',
  },
];

const createUser = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: bcrypt.hashSync(faker.internet.password(), 10),
  roleId: faker.datatype.number({ min: 2, max: 4 }),
});

const main = async () => {
  const users = [
    {
      name: 'Admin',
      email: 'admin@mail.com',
      password: bcrypt.hashSync('admin', 10),
      roleId: 1,
    },
  ];

  for (let i = 0; i < 10; i++) {
    users.push(createUser());
  }

  await prisma.$transaction([
    prisma.role.createMany({
      data: roles,
    }),
    prisma.user.createMany({
      data: users,
    }),
  ]);
};

main()
  .catch((err) => console.log(err))
  .finally(async () => await prisma.$disconnect());
