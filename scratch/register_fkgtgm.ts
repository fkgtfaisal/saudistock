import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function configureUser(email: string, name: string) {
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
      subscriptionTier: 'ELITE'
    },
    create: {
      email,
      password: hashedPassword,
      name,
      subscriptionTier: 'ELITE'
    }
  })
  
  console.log(`✅ User ${email} configured successfully in Neon DB!`)
  console.log(`- Email: ${user.email}`)
  console.log(`- Name: ${user.name}`)
  console.log(`- Subscription: ${user.subscriptionTier}`)
}

async function main() {
  await configureUser('fkgtgm@gmail.com', 'فيصل')
  await configureUser('fkgt@hotmail.com', 'محمد علي')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
