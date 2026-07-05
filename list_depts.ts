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
  const dists = await prisma.district.findMany({
    where: { name: { equals: 'Ventanilla', mode: 'insensitive' } },
    include: {
      province: {
        include: {
          department: true
        }
      }
    }
  });
  console.log('Ventanilla findings:', JSON.stringify(dists, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
