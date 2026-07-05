import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : undefined;

const adapter = new PrismaPg({
  connectionString: databaseUrl!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const deptsCount = await prisma.department.count();
  const provsCount = await prisma.province.count();
  const distsCount = await prisma.district.count();
  const stationsCount = await prisma.policeStation.count();
  
  console.log(`DB Counts:`);
  console.log(`- Departments: ${deptsCount}`);
  console.log(`- Provinces: ${provsCount}`);
  console.log(`- Districts: ${distsCount}`);
  console.log(`- Help Centers (Stations + CEMs): ${stationsCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
