import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('Seeding database...')

  const perm1 = uuidv4()
  const perm2 = uuidv4()
  const perm3 = uuidv4()
  const perm4 = uuidv4()
  const perm5 = uuidv4()
  const perm6 = uuidv4()
  const perm7 = uuidv4()
  const perm8 = uuidv4()
  const perm9 = uuidv4()
  const perm10 = uuidv4()

  async function upsertPermission(id: string, resource: string, action: string, description: string) {
    return prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: { description },
      create: { id, resource, action, description },
    })
  }

  const perm1Rec = await upsertPermission(perm1, 'post', 'create', 'Create posts')
  const perm2Rec = await upsertPermission(perm2, 'post', 'read', 'Read posts')
  const perm3Rec = await upsertPermission(perm3, 'post', 'update', 'Update posts')
  const perm4Rec = await upsertPermission(perm4, 'post', 'delete', 'Delete posts')
  const perm5Rec = await upsertPermission(perm5, 'user', 'manage', 'Manage users')
  const perm6Rec = await upsertPermission(perm6, 'role', 'manage', 'Manage roles')
  const perm7Rec = await upsertPermission(perm7, 'tag', 'create', 'Create tags')
  const perm8Rec = await upsertPermission(perm8, 'tag', 'read', 'Read tags')
  const perm9Rec = await upsertPermission(perm9, 'tag', 'update', 'Update tags')
  const perm10Rec = await upsertPermission(perm10, 'tag', 'delete', 'Delete tags')

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: 'Full system access' },
    create: { name: 'ADMIN', description: 'Full system access' },
  })

  const editorRole = await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: { description: 'Can manage blog content' },
    create: { name: 'EDITOR', description: 'Can manage blog content' },
  })

  const viewerRole = await prisma.role.upsert({
    where: { name: 'VIEWER' },
    update: { description: 'Read-only access' },
    create: { name: 'VIEWER', description: 'Read-only access' },
  })

  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: [
          { id: perm1Rec.id }, { id: perm2Rec.id }, { id: perm3Rec.id }, { id: perm4Rec.id },
          { id: perm5Rec.id }, { id: perm6Rec.id },
          { id: perm7Rec.id }, { id: perm8Rec.id }, { id: perm9Rec.id }, { id: perm10Rec.id },
        ],
      },
    },
  })

  await prisma.role.update({
    where: { id: editorRole.id },
    data: {
      permissions: {
        connect: [
          { id: perm1Rec.id }, { id: perm2Rec.id }, { id: perm3Rec.id }, { id: perm4Rec.id },
          { id: perm7Rec.id }, { id: perm8Rec.id }, { id: perm9Rec.id },
        ],
      },
    },
  })

  await prisma.role.update({
    where: { id: viewerRole.id },
    data: {
      permissions: {
        connect: [{ id: perm2Rec.id }, { id: perm8Rec.id }],
      },
    },
  })

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@slowlife.com' },
    update: {},
    create: {
      email: 'admin@slowlife.com',
      passwordHash: await hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'Slow Life',
      roleId: adminRole.id,
      isActive: true,
    },
  })

  const category = await prisma.category.upsert({
    where: { slug: 'general' },
    update: { description: 'General posts' },
    create: {
      name: 'General',
      slug: 'general',
      description: 'General posts',
    },
  })

  const lifestyleTag = await prisma.tag.upsert({
    where: { slug: 'lifestyle' },
    update: { name: 'Lifestyle' },
    create: { name: 'Lifestyle', slug: 'lifestyle' },
  })

  const travelTag = await prisma.tag.upsert({
    where: { slug: 'travel' },
    update: { name: 'Travel' },
    create: { name: 'Travel', slug: 'travel' },
  })

  const technologyTag = await prisma.tag.upsert({
    where: { slug: 'technology' },
    update: { name: 'Technology' },
    create: { name: 'Technology', slug: 'technology' },
  })

  const mindfulnessTag = await prisma.tag.upsert({
    where: { slug: 'mindfulness' },
    update: { name: 'Mindfulness' },
    create: { name: 'Mindfulness', slug: 'mindfulness' },
  })

  const post1Slug = 'bienvenidos-a-slow-life'
  const post2Slug = 'viajando-con-proposito'
  const post3Slug = 'tecnologia-consciente'

  await prisma.post.upsert({
    where: { slug: post1Slug },
    update: {},
    create: {
      title: 'Bienvenidos a Slow Life',
      slug: post1Slug,
      content: 'Este es nuestro primer post. Creemos en vivir de manera consciente, disfrutando cada momento y cultivando una vida con propósito.',
      excerpt: 'Nuestra filosofía para una vida más consciente y plena.',
      status: 'PUBLISHED',
      authorId: adminUser.id,
      categoryId: category.id,
      publishedAt: new Date(),
      tags: { connect: [{ id: lifestyleTag.id }, { id: mindfulnessTag.id }] },
    },
  })

  await prisma.post.upsert({
    where: { slug: post2Slug },
    update: {},
    create: {
      title: 'Viajando con Propósito',
      slug: post2Slug,
      content: 'El viaje consciente nos permite conectar con nuevas culturas, personas y paisajes de una manera respetuosa y transformadora.',
      excerpt: 'Cómo convertir tus viajes en experiencias significativas.',
      status: 'PUBLISHED',
      authorId: adminUser.id,
      categoryId: category.id,
      publishedAt: new Date(),
      tags: { connect: [{ id: travelTag.id }, { id: lifestyleTag.id }] },
    },
  })

  await prisma.post.upsert({
    where: { slug: post3Slug },
    update: {},
    create: {
      title: 'Tecnología Consciente',
      slug: post3Slug,
      content: 'La tecnología puede ser una aliada para el bienestar si aprendemos a usarla con intención y equilibrio en nuestras vidas.',
      excerpt: 'Usa la tecnología a tu favor sin perder el equilibrio.',
      status: 'DRAFT',
      authorId: adminUser.id,
      categoryId: category.id,
      tags: { connect: [{ id: technologyTag.id }, { id: mindfulnessTag.id }] },
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
