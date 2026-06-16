import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { config } from 'dotenv'

// Load environment variables from root .env file
config({ path: '../../../.env' })

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { slug: 'ADMIN' },
    update: {},
    create: {
      name: 'Admin',
      slug: 'ADMIN',
      description: 'Full system access',
    },
  })

  const accountantRole = await prisma.role.upsert({
    where: { slug: 'ACCOUNTANT' },
    update: {},
    create: {
      name: 'Accountant',
      slug: 'ACCOUNTANT',
      description: 'Accounting operations',
    },
  })

  const ceoRole = await prisma.role.upsert({
    where: { slug: 'CEO' },
    update: {},
    create: {
      name: 'CEO',
      slug: 'CEO',
      description: 'Executive access',
    },
  })

  const partnerRole = await prisma.role.upsert({
    where: { slug: 'PARTNER' },
    update: {},
    create: {
      name: 'Partner',
      slug: 'PARTNER',
      description: 'Partner access',
    },
  })

  console.log('Roles created')

  // Create admin user with PIN: 0000
  const hashedPin = await bcrypt.hash('0000', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@obook.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@obook.com',
      pin: hashedPin,
      roleId: adminRole.id,
    },
  })

  console.log('Admin user created (PIN: 0000)')

  // Create default cashbook
  const defaultCashbook = await prisma.cashbook.upsert({
    where: { id: 'default-cashbook' },
    update: {},
    create: {
      id: 'default-cashbook',
      name: 'Main Cashbook',
      description: 'Default cashbook for O Book',
      baseCurrency: 'AED',
    },
  })

  console.log('Default cashbook created')

  // Assign admin to cashbook
  await prisma.userCashbook.upsert({
    where: {
      userId_cashbookId: {
        userId: adminUser.id,
        cashbookId: defaultCashbook.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      cashbookId: defaultCashbook.id,
    },
  })

  console.log('Admin assigned to cashbook')

  // Create default categories
  const cashInCategories = [
    { name: 'Sales', type: 'CASH_IN', color: '#22c55e' },
    { name: 'Investment', type: 'CASH_IN', color: '#3b82f6' },
    { name: 'Loan', type: 'CASH_IN', color: '#8b5cf6' },
    { name: 'Other Income', type: 'CASH_IN', color: '#06b6d4' },
  ]

  const cashOutCategories = [
    { name: 'Salary', type: 'CASH_OUT', color: '#ef4444' },
    { name: 'Rent', type: 'CASH_OUT', color: '#f97316' },
    { name: 'Utilities', type: 'CASH_OUT', color: '#eab308' },
    { name: 'Supplies', type: 'CASH_OUT', color: '#84cc16' },
    { name: 'Marketing', type: 'CASH_OUT', color: '#14b8a6' },
    { name: 'Travel', type: 'CASH_OUT', color: '#06b6d4' },
    { name: 'Other Expenses', type: 'CASH_OUT', color: '#6366f1' },
  ]

  for (const category of [...cashInCategories, ...cashOutCategories]) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  console.log('Default categories created')

  // Create default payment methods
  const paymentMethods = [
    { name: 'Cash', icon: '💵' },
    { name: 'Bank Transfer', icon: '🏦' },
    { name: 'Credit Card', icon: '💳' },
    { name: 'Check', icon: '📄' },
    { name: 'Online Payment', icon: '🌐' },
  ]

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: method.name },
      update: {},
      create: method,
    })
  }

  console.log('Default payment methods created')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
