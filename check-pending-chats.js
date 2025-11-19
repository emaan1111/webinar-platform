const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPendingChats() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    const allMessages = await prisma.chatMessage.findMany({
      select: {
        id: true,
        message: true,
        isScripted: true,
        isApproved: true,
        isHidden: true,
        userName: true,
        webinarId: true
      },
      take: 50,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total messages in database: ${allMessages.length}\n`);
    
    // Count by type
    const scripted = allMessages.filter(m => m.isScripted === true);
    const pending = allMessages.filter(m => m.isScripted === false && m.isApproved === false);
    const approved = allMessages.filter(m => m.isScripted === false && m.isApproved === true);
    
    console.log('📈 Message breakdown:');
    console.log(`  Scripted (isScripted=true): ${scripted.length}`);
    console.log(`  Pending (isScripted=false, isApproved=false): ${pending.length}`);
    console.log(`  Approved (isScripted=false, isApproved=true): ${approved.length}\n`);
    
    if (pending.length > 0) {
      console.log('🔍 Sample PENDING messages:');
      pending.slice(0, 5).forEach((msg, i) => {
        console.log(`  ${i+1}. isScripted=${msg.isScripted}, isApproved=${msg.isApproved}`);
        console.log(`     Message: "${msg.message.slice(0, 60)}"`);
      });
    } else {
      console.log('⚠️  NO PENDING MESSAGES FOUND!');
      console.log('    All messages are either scripted=true or approved=true\n');
      
      if (allMessages.length > 0) {
        console.log('🔍 Sample of what exists in database:');
        allMessages.slice(0, 5).forEach((msg, i) => {
          console.log(`  ${i+1}. isScripted=${msg.isScripted} (${typeof msg.isScripted}), isApproved=${msg.isApproved} (${typeof msg.isApproved})`);
          console.log(`     Message: "${msg.message.slice(0, 50)}"`);
        });
      }
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkPendingChats();
