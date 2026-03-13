import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

  // 2. Crear Usuario Administrador inicial
  const admin = await prisma.user.upsert({
    where: { email: 'admin@calidad.com' },
    update: {
      password: 'admin123', // Contraseña inicial
    },
    create: {
      email: 'admin@calidad.com',
      password: 'admin123',
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
