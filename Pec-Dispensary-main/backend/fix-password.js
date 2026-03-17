import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPassword() {
  try {
    const hashedPassword = await bcrypt.hash('EgcNhAxxx.29t*F', 10);
    
    const updated = await prisma.user.update({
      where: { email: 'realxashu@gmail.com' },
      data: { password_hash: hashedPassword }
    });
    
    console.log('✅ Successfully fixed password for user');
    console.log('Email:', updated.email);
    console.log('Full Name:', updated.full_name);
    console.log('Password hash set:', updated.password_hash ? 'YES' : 'NO');
    console.log('\n🎉 You can now login at: http://localhost:5173/login');
    console.log('Email: realxashu@gmail.com');
    console.log('Password: EgcNhAxxx.29t*F');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPassword();
