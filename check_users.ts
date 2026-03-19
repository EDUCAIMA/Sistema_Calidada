import 'dotenv/config'
import prisma from './src/lib/db'

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true
    }
  })
  console.log(JSON.stringify(users, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
