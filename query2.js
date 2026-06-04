const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ext = await prisma.externalWebinarRegistration.findUnique({
    where: { id: "cmo8wwnzh07fpmu0f4b3z1imi" }
  });
  console.log(ext);
  const ext2 = await prisma.externalWebinarRegistration.findFirst({
    where: { id: "ext_cmo8wwnzh07fpmu0f4b3z1imi" }
  });
  console.log('ext2:', ext2);
}
main().finally(() => prisma.$disconnect());
