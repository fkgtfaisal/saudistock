import * as dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding demo user...')
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@tadawul.terminal' },
    update: {},
    create: {
      id: 'demo-user-123',
      email: 'demo@tadawul.terminal',
      name: 'مستخدم تجريبي',
      subscriptionTier: 'PRO',
      watchlists: {
        create: [
          {
            name: 'الأسهم القيادية',
            items: {
              create: [
                { symbol: '1120.SR' }, // Al Rajhi
                { symbol: '2222.SR' }, // Aramco
                { symbol: '1180.SR' }, // SNB
              ]
            }
          }
        ]
      }
    },
  })

  console.log('✅ Demo user seeded:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
