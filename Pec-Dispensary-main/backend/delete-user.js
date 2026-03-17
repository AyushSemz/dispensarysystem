import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  try {
    const deleted = await prisma.user.delete({
      where: { email: 'realxashu@gmail.com' }
    });
    
    console.log('✅ Successfully deleted corrupted user account');
    console.log('Email:', deleted.email);
    console.log('\n👉 Now you can register again at: http://localhost:5173/register/patient');
    console.log('Use the same email: realxashu@gmail.com');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
