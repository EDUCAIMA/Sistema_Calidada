import 'dotenv/config'
import prisma from './src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      // It's likely not hashed (bcrypt hashes start with $2a$ or $2b$)
      console.log(`Hashing password for user: ${user.email}`)
      const hashedPassword = await bcrypt.hash(user.password, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
    }
  }
  console.log('Finished updating passwords.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
