import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : undefined;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});
const prisma = new PrismaClient({ adapter });

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')    // Remove special characters
    .replace(/\s+/g, ' ')           // Collapse multiple spaces
    .trim();
}

async function main() {
  const targetDepts = ['ICA', 'JUNIN', 'LA LIBERTAD', 'LAMBAYEQUE', 'LIMA'];
  const deptsQuery = targetDepts.map(d => `'${d}'`).join(',');
  const url = `https://geomininter.mininter.gob.pe/arcgis/rest/services/pnp/policia_nacional_peru/MapServer/0/query?where=departamento+IN+(${encodeURIComponent(deptsQuery)})&outFields=*&f=pjson&resultRecordCount=1000`;

  console.log('📡 Descargando dependencias oficiales desde el Geoportal del MININTER...');
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status}`);
  }
  const arcgisData = await res.json() as any;
  const features = arcgisData.features || [];
  console.log(`✅ Se descargaron ${features.length} comisarías del MININTER.`);

  // Load all districts from the database for the 5 target departments
  console.log('🔍 Cargando distritos de la base de datos para los 5 departamentos...');
  const dbDistricts = await prisma.district.findMany({
    where: {
      province: {
        department: {
          name: {
            in: targetDepts,
            mode: 'insensitive',
          },
        },
      },
    },
    include: {
      province: {
        include: {
          department: true,
        },
      },
      stations: true,
    },
  });

  console.log(`✅ Se cargaron ${dbDistricts.length} distritos desde la base de datos.`);

  let insertedCount = 0;
  let alreadyExistsCount = 0;
  const districtsWithStations: string[] = [];
  const districtsWithoutStations: Array<{
    distrito: string;
    provincia: string;
    departamento: string;
  }> = [];

  // Index the ArcGIS comisarías by normalized departamento -> provincia -> distrito
  const stationsMap = new Map<string, any[]>();
  for (const f of features) {
    const attr = f.attributes;
    const deptNorm = normalize(attr.departamento);
    const provNorm = normalize(attr.provincia);
    const distNorm = normalize(attr.distrito);
    const key = `${deptNorm}|${provNorm}|${distNorm}`;
    
    if (!stationsMap.has(key)) {
      stationsMap.set(key, []);
    }
    stationsMap.get(key)!.push(attr);
  }

  console.log('✍️  Procesando e insertando comisarías en la base de datos...');
  
  for (const dist of dbDistricts) {
    const deptNorm = normalize(dist.province.department.name);
    const provNorm = normalize(dist.province.name);
    const distNorm = normalize(dist.name);
    const key = `${deptNorm}|${provNorm}|${distNorm}`;
    
    const matchedStations = stationsMap.get(key) || [];

    if (matchedStations.length > 0) {
      districtsWithStations.push(dist.id);
      
      for (const stationAttr of matchedStations) {
        const stationName = stationAttr.comisaria || `Comisaría PNP ${dist.name}`;
        
        // Check if this station already exists in the database (or was just inserted earlier manually)
        const exists = dist.stations.some(s => normalize(s.name) === normalize(stationName));
        if (exists) {
          alreadyExistsCount++;
          continue;
        }

        // Insert station
        await prisma.policeStation.create({
          data: {
            name: stationName,
            address: `Jurisdicción de ${stationName}, Distrito de ${dist.name}, Provincia de ${dist.province.name}, Departamento de ${dist.province.department.name}`,
            phone: '105 (Central de Emergencias PNP)',
            districtId: dist.id,
          },
        });
        insertedCount++;
      }
    } else {
      districtsWithoutStations.push({
        distrito: dist.name,
        provincia: dist.province.name,
        departamento: dist.province.department.name,
      });
    }
  }

  console.log('\n📊 Resumen de inserción:');
  console.log(`   - Comisarías insertadas: ${insertedCount}`);
  console.log(`   - Comisarías que ya existían: ${alreadyExistsCount}`);
  console.log(`   - Distritos con comisarías encontradas: ${districtsWithStations.length}`);
  console.log(`   - Distritos sin comisarías: ${districtsWithoutStations.length}`);

  // Write results to a file for the user
  const resultPath = path.join(process.cwd(), 'seed_third_5_departments_report.json');
  fs.writeFileSync(resultPath, JSON.stringify({
    resumen: {
      comisariasInsertadas: insertedCount,
      comisariasExistentes: alreadyExistsCount,
      distritosConComisarias: districtsWithStations.length,
      distritosSinComisarias: districtsWithoutStations.length,
    },
    distritosSinComisarias: districtsWithoutStations,
  }, null, 2));
  console.log(`\n📄 Reporte de distritos sin comisarías guardado en: ${resultPath}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
