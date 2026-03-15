import 'dotenv/config'
import prisma from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Iniciando el proceso de seed...')

  // 1. Crear Tenant de ejemplo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'empresa-principal' },
    update: {},
    create: {
      name: 'Empresa Principal QMS',
      slug: 'empresa-principal',
      plan: 'PROFESIONAL',
    },
  })

  // Hash the admin password
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 2. Crear Usuario Administrador inicial
  const admin = await prisma.user.upsert({
    where: { email: 'admin@calidad.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'admin@calidad.com',
      password: hashedPassword,
      name: 'Administrador Sistema',
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
    },
  })

  console.log({ tenant, admin })
  console.log('¡Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
