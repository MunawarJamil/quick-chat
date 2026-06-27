import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@quickchat.dev' },
    update: {},
    create: {
      email: 'admin@quickchat.dev',
      fullName: 'Munawar Jamil',
      passwordHash: 'dev_password_hash_replace_later',
      emailVerified: true,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'quick-chat' },
    update: {},
    create: {
      name: 'Quick Chat',
      slug: 'quick-chat',
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'OWNER',
      joinedAt: new Date(),
    },
  });

  await prisma.workspaceAllowedDomain.upsert({
    where: {
      workspaceId_domain: {
        workspaceId: workspace.id,
        domain: 'localhost',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      domain: 'localhost',
    },
  });

  await prisma.subscription.create({
    data: {
      workspaceId: workspace.id,
      plan: 'FREE',
      status: 'ACTIVE',
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.workspaceUsage.upsert({
    where: {
      workspaceId_usageDate: {
        workspaceId: workspace.id,
        usageDate: today,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      usageDate: today,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
