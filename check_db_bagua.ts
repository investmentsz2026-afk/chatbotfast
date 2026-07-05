import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : undefined;

const adapter = new PrismaPg({
  connectionString: databaseUrl!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const depts = await prisma.department.findMany({
    where: { name: { equals: 'Amazonas', mode: 'insensitive' } },
    include: {
      provinces: {
        include: {
          districts: true
        }
      }
    }
  });
  
  console.log(JSON.stringify(depts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
