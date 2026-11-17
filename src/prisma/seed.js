import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { DEFAULT_TEMPLATES } from '../modules/categories/categoryTemplates.js';

const prisma = new PrismaClient();

async function main() {
  console.log(' Starting database seeding...');

  const businessTypes = [
    'Retail & Wholesale',
    'Agriculture & Agribusiness',
    'Food Services & Hospitality',
    'Manufacturing & Production',
    'Construction & Real Estate',
    'Transport & Logistics',
    'Technology & Digital Services',
    'Professional Services',
    'Health & Personal Care',
    'Education & Training',
    'Tourism & Creative Industries',
    'Other Services'
  ];

  for (const [index, businessType] of businessTypes.entries()) {
    const defaults = DEFAULT_TEMPLATES[businessType] || {};
    const existing = await prisma.businessCategory.findUnique({ where: { businessType } });
    if (!existing) {
      await prisma.businessCategory.create({
        data: { businessType, icon: defaults.icon || null, description: defaults.description || null, sortOrder: index }
      });
    } else {
      // Fill in display details without overwriting anything an admin has set.
      await prisma.businessCategory.update({
        where: { businessType },
        data: {
          icon: existing.icon ?? defaults.icon ?? null,
          description: existing.description ?? defaults.description ?? null,
          sortOrder: existing.sortOrder || index
        }
      });
    }
  }

  console.log(`✅ Business categories available: ${businessTypes.length}`);
  
  const adminEmail = 'admin@elevata.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('Admin@2026', saltRounds);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        phone: '+250780000000',
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        isPilotApproved: true,
        is_approved: true
      }
    });

    console.log(`✅ Admin user created successfully: ${admin.email}`);
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isPilotApproved: true, is_approved: true }
    });
    console.log('ℹ️ Admin user updated to be pilot approved.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
