import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAppointments() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'realxashu@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Checking appointments for:', user.full_name);
    console.log('User ID:', user.id);
    console.log('Role:', user.role);
    console.log('');

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where: { patient_id: user.id },
      include: {
        doctor: {
          select: {
            full_name: true,
            doctor_profile: {
              select: { specialization: true }
            }
          }
        }
      }
    });

    console.log('📅 Total appointments:', appointments.length);
    
    if (appointments.length === 0) {
      console.log('\n❌ No appointments found!');
      console.log('This is why you see "Failed to load appointments" or empty list.');
      console.log('\n✅ Solution: Book an appointment first!');
      console.log('1. Login at: http://localhost:5173/login');
      console.log('2. Go to: http://localhost:5173/appointments/book');
      console.log('3. Select a doctor and book an appointment');
    } else {
      console.log('\n✅ Found appointments:');
      appointments.forEach((apt, i) => {
        console.log(`\n${i + 1}. Doctor: ${apt.doctor.full_name}`);
        console.log(`   Time: ${apt.appointment_time}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Reason: ${apt.reason || 'N/A'}`);
      });
    }

    // Check if there are any doctors
    const doctors = await prisma.user.count({
      where: { role: 'DOCTOR' }
    });

    console.log(`\n👨‍⚕️ Total doctors in system: ${doctors}`);
    
    if (doctors === 0) {
      console.log('⚠️  No doctors registered! You need doctors to book appointments.');
      console.log('Register a doctor at: http://localhost:5173/register/doctor');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppointments();
