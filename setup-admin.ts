import prisma from './src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@saudistock.com' },
    update: {
      password: hashedPassword,
      name: 'مدير النظام',
      subscriptionTier: 'ELITE'
    },
    create: {
      email: 'admin@saudistock.com',
      password: hashedPassword,
      name: 'مدير النظام',
      subscriptionTier: 'ELITE'
    }
  })
  
  console.log('✅ Admin user ready!')
  console.log('Email: admin@saudistock.com')
  console.log('Password: 123456')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
