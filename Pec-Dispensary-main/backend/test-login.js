import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: 'realxashu@gmail.com' }
    });

    if (!user) {
      console.log('❌ User NOT found in database');
      console.log('Please register first at: http://localhost:5173/register/patient');
      return;
    }

    console.log('✅ User found in database');
    console.log('Email:', user.email);
    console.log('Full Name:', user.full_name);
    console.log('Role:', user.role);
    console.log('Created:', user.created_at);
    console.log('Password hash exists:', user.password_hash ? 'YES' : 'NO');
    console.log('Password hash length:', user.password_hash ? user.password_hash.length : 0);

    // Test password
    if (!user.password_hash) {
      console.log('❌ No password hash stored for this user!');
      console.log('The account may be corrupted. Please register again.');
      return;
    }
    
    const passwordMatch = await bcrypt.compare('EgcNhAxxx.29t*F', user.password_hash);
    
    if (passwordMatch) {
      console.log('✅ Password is CORRECT');
      console.log('\n🎉 Login credentials are valid!');
      console.log('You should be able to login at: http://localhost:5173/login');
    } else {
      console.log('❌ Password is INCORRECT');
      console.log('Please check your password or register a new account');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
