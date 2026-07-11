import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const products = [
  {
    id: '875942-100',
    name: 'NIKE AIR MAX 1 ULTRA 2.0 FLYKNIT',
    price: 180,
    description:
      'LIGHTER THAN EVER! The Nike Air Max 1 Ultra 2.0 Flyknit Men\'s Shoe updates the iconic original with an ultra-lightweight upper while keeping the plush, time-tested Max Air cushioning.',
    detail:
      'LIGHTER THAN EVER! The Nike Air Max 1 Ultra 2.0 Flyknit Men\'s Shoe updates the iconic original with an ultra-lightweight upper while keeping the plush, time-tested Max Air cushioning.',
    images: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'],
  },
  {
    id: '880843-003',
    name: 'NIKE FREE RN FLYKNIT 2017',
    price: 120,
    description:
      'The Nike Free RN Flyknit 2017 Men\'s Running Shoe brings you miles of comfort with an exceptionally flexible outsole for the ultimate natural ride.',
    detail:
      'The Nike Free RN Flyknit 2017 Men\'s Running Shoe brings you miles of comfort with an exceptionally flexible outsole for the ultimate natural ride. Flyknit fabric wraps your foot for a snug, supportive fit while a tri-star outsole expands and flexes to let your foot move naturally.',
    images: ['t1', 't2', 't3', 't4', 't5', 't6', 't7'],
  },
  {
    id: '384664-113',
    name: 'AIR JORDAN 6 RETRO',
    price: 190,
    description:
      'The Air Jordan 6 Retro Men\'s Shoe celebrates a championship heritage with design lines and plush cushioning inspired by the ground-breaking hoops original.',
    detail:
      'The Air Jordan 6 Retro Men\'s Shoe celebrates a championship heritage with design lines and plush cushioning inspired by the ground-breaking hoops original.',
    images: ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'],
  },
  {
    id: '805144-852',
    name: 'TECH FLEECE WINDRUNNER',
    price: 130,
    description:
      'The Nike Sportswear Tech Fleece Windrunner Men\'s Hoodie is redesigned for cooler weather with smooth, engineered fleece that offers lightweight warmth.',
    detail:
      'The Nike Sportswear Tech Fleece Windrunner Men\'s Hoodie is redesigned for cooler weather with smooth, engineered fleece that offers lightweight warmth. Bonded seams lend a modern update to the classic chevron design.',
    images: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
  },
];

const nikePlusActivities = [
  { title: 'RUNS THIS MONTH', value: '12', unit: 'runs' },
  { title: 'DISTANCE', value: '87.4', unit: 'km' },
  { title: 'BEST PACE', value: '5:32', unit: 'min/km' },
  { title: 'CALORIES', value: '4,200', unit: 'kcal' },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'jordan@nike.com' },
    update: {},
    create: {
      name: 'Jordan Runner',
      email: 'jordan@nike.com',
      passwordHash,
    },
  });

  const existingActivities = await prisma.nikePlusActivity.count({
    where: { userId: demoUser.id },
  });

  if (existingActivities === 0) {
    await prisma.nikePlusActivity.createMany({
      data: nikePlusActivities.map((activity) => ({
        ...activity,
        userId: demoUser.id,
      })),
    });
  }

  console.log('Seed completed:', {
    products: products.length,
    demoUser: demoUser.email,
    activities: nikePlusActivities.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
