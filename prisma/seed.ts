import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { v4 as uuidv4 } from 'uuid'
import { createHash } from 'node:crypto'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding database...')

  const adminRoleId = uuidv4()
  const editorRoleId = uuidv4()
  const viewerRoleId = uuidv4()

  const perm1 = uuidv4()
  const perm2 = uuidv4()
  const perm3 = uuidv4()
  const perm4 = uuidv4()
  const perm5 = uuidv4()
  const perm6 = uuidv4()

  await prisma.permission.createMany({
    data: [
      { id: perm1, resource: 'post', action: 'create', description: 'Create posts' },
      { id: perm2, resource: 'post', action: 'read', description: 'Read posts' },
      { id: perm3, resource: 'post', action: 'update', description: 'Update posts' },
      { id: perm4, resource: 'post', action: 'delete', description: 'Delete posts' },
      { id: perm5, resource: 'user', action: 'manage', description: 'Manage users' },
      { id: perm6, resource: 'role', action: 'manage', description: 'Manage roles' },
    ],
    skipDuplicates: true,
  })

  await prisma.role.createMany({
    data: [
      {
        id: adminRoleId,
        name: 'ADMIN',
        description: 'Full system access',
      },
      {
        id: editorRoleId,
        name: 'EDITOR',
        description: 'Can manage blog content',
      },
      {
        id: viewerRoleId,
        name: 'VIEWER',
        description: 'Read-only access',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.role.update({
    where: { id: adminRoleId },
    data: {
      permissions: {
        connect: [{ id: perm1 }, { id: perm2 }, { id: perm3 }, { id: perm4 }, { id: perm5 }, { id: perm6 }],
      },
    },
  })

  await prisma.role.update({
    where: { id: editorRoleId },
    data: {
      permissions: {
        connect: [{ id: perm1 }, { id: perm2 }, { id: perm3 }, { id: perm4 }],
      },
    },
  })

  await prisma.role.update({
    where: { id: viewerRoleId },
    data: {
      permissions: {
        connect: [{ id: perm2 }],
      },
    },
  })

  const adminUserId = uuidv4()
  await prisma.user.upsert({
    where: { email: 'admin@slowlife.com' },
    update: {},
    create: {
      id: adminUserId,
      email: 'admin@slowlife.com',
      passwordHash: hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'Slow Life',
      roleId: adminRoleId,
      isActive: true,
    },
  })

  const categoryId = uuidv4()
  await prisma.category.create({
    data: {
      id: categoryId,
      name: 'General',
      slug: 'general',
      description: 'General posts',
    },
  })

  console.log('Seed completed successfully!')
  console.log('  Admin user: admin@slowlife.com / admin123')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
