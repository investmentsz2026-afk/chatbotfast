import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// URLs de datos de Ubigeos
const DEPT_URL = 'https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/departamentos.json';
const PROV_URL = 'https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/provincias.json';
const DIST_URL = 'https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/distritos.json';

// --- Textos de conocimiento a precargar ---
const KNOWLEDGE_DOCS = [
  {
    title: 'MIS DERECHOS (APP ALERTA VIOLETA)',
    sourceType: 'text',
    content: `💜 MIS DERECHOS
Conoce los derechos que la ley te reconoce

🌷 Si estás viviendo una situación de violencia, recuerda algo importante:
No estás sola.
La Ley N.° 30364 protege a todas las mujeres frente a cualquier forma de violencia y obliga a las autoridades a brindarte atención, protección y apoyo.

🛡️ DERECHO A VIVIR LIBRE DE VIOLENCIA
Tienes derecho a vivir sin miedo y sin sufrir agresiones.
Nadie puede:
❌ Golpearte.
❌ Humillarte.
❌ Amenazarte.
❌ Controlarte.
❌ Obligarte a tener relaciones sexuales.
❌ Quitarte tu dinero o impedirte trabajar.
Base legal: Ley N.° 30364.

📝 DERECHO A DENUNCIAR
Puedes denunciar si has sido víctima de violencia.
Puedes hacerlo en:
👮 Comisarías.
⚖️ Fiscalía.
🏛️ Poder Judicial.
💻 Plataformas digitales oficiales.
No necesitas permiso de nadie para denunciar.
Base legal: Arts. 14 y 16 del Reglamento.

🚫 DERECHO A DENUNCIAR AUNQUE NO TENGAS PRUEBAS
Muchas mujeres creen que no pueden denunciar porque no tienen fotografías o testigos.
Eso NO es cierto.
Tu denuncia debe ser recibida aunque no tengas:
❌ Fotos.
❌ Videos.
❌ Testigos.
❌ Certificados médicos.
❌ Informes psicológicos.
Base legal: Art. 19 del Reglamento.

Resumen legal adicional: En el Perú, la Ley N.° 30364 protege a las mujeres frente a la violencia física, psicológica, sexual y económica o patrimonial. Además, el artículo 122-B del Código Penal sanciona las agresiones contra las mujeres o integrantes del grupo familiar. Esto significa que tienes derecho a vivir sin violencia, a denunciar, a ser escuchada y atendida con respeto, a recibir protección inmediata si estás en peligro, y a que tu caso sea tratado con confidencialidad. También tienes derecho a recibir orientación y apoyo sin que te culpen, humillen o minimicen lo que te está pasando.

La ley te protege si sufres golpes, empujones, bofetadas o cualquier agresión física; también si recibes insultos, amenazas, humillaciones, control excesivo o manipulación emocional. Del mismo modo, te protege frente a tocamientos indebidos, acoso, actos sexuales sin tu consentimiento y frente a situaciones donde te quitan tu dinero, controlan tus ingresos, te impiden trabajar o dañan tus bienes.
Base legal: Ley N.° 30364 y artículo 122-B del Código Penal.

⚡ DERECHO A RECIBIR PROTECCIÓN INMEDIATA
Si estás en peligro, las autoridades deben actuar rápidamente para protegerte. La ley prioriza tu seguridad y tu vida.
Base legal: Arts. 6 y 37 del Reglamento.

🚔 DERECHO A MEDIDAS DE PROTECCIÓN
Un juez puede ordenar medidas para protegerte. Por ejemplo:
✅ Que el agresor no se acerque a ti.
✅ Que no pueda llamarte ni escribirte.
✅ Patrullaje policial cerca de tu domicilio.
✅ Protección para tus hijos e hijas.
✅ Otras medidas necesarias para tu seguridad.
Base legal: Arts. 35, 36 y 37 del Reglamento.

🏢 DERECHO A ORIENTACIÓN LEGAL GRATUITA Y APOYO
No necesitas pagar para recibir ayuda legal. Puedes recibir orientación y acompañamiento gratuito en:
🏢 Centro Emergencia Mujer (CEM).
⚖️ Defensa Pública.
Base legal: Arts. 14, 15 y 36.5 del Reglamento.

❤️ DERECHO A ATENCIÓN PSICOLÓGICA Y APOYO SOCIAL
La violencia también afecta tu salud emocional. Tienes derecho a recibir apoyo psicológico especializado y acompañamiento social para ayudarte en tu recuperación al amparo de la Ley N.° 30364.

🔒 CONFIDENCIALIDAD Y RESERVA DE IDENTIDAD
Tus datos personales deben mantenerse protegidos. Si existe riesgo para tu seguridad, las autoridades pueden proteger tu identidad.
Base legal: Art. 9 del Reglamento.

🚫 NO SER REVICTIMIZADA
Nadie puede culparte por lo ocurrido, decirte que exageras, humillarte, burlarse de ti o hacer comentarios ofensivos. Debes ser tratada con respeto y dignidad.
Base legal: Arts. 4.6 y 20.5 del Reglamento.

🗣️ DERECHO A SER ESCUCHADA Y ATENDIDA EN TU IDIOMA
Tu declaración tiene valor. Las autoridades deben escuchar tu versión de los hechos. Si hablas quechua, aimara o cualquier lengua originaria, tienes derecho a recibir atención mediante intérprete o traductor. Tienes derecho al acceso a la justicia y tu caso no puede cerrarse simplemente porque tengas miedo.
Base legal: Arts. 2, 6-B, 12, 20, 32 y 32 del Reglamento.`
  },
  {
    title: 'ORIENTACIÓN SEGURA (APP ALERTA VIOLETA)',
    sourceType: 'text',
    content: `🧭 ORIENTACIÓN SEGURA
💜 No estás sola
Si estás viviendo una situación de violencia, recuerda algo importante:
👉 La violencia nunca es tu culpa.
👉 Tienes derecho a recibir ayuda, protección y orientación.
👉 En Perú existen instituciones obligadas por ley a protegerte.
Esta guía te ayudará a identificar lo que está ocurriendo y qué hacer paso a paso.

🚨 ¿ESTÁS EN PELIGRO AHORA MISMO?
Si tu agresor está cerca o sientes que tu vida o integridad corre peligro:
📞 Llama al 105 (Policía Nacional del Perú)
📞 Llama a la Línea 100
🏃 Dirígete a una comisaría o lugar seguro.
👨👩👧 Busca apoyo de familiares, vecinos o personas de confianza.
📍 Utiliza el buscador de comisarías de Alerta Violeta para ubicar ayuda cercana.

🔍 IDENTIFICA EL TIPO DE VIOLENCIA Y QUÉ HACER:

👊 VIOLENCIA FÍSICA
Ocurre cuando una persona daña tu cuerpo o intenta hacerlo (golpes, puñetes, patadas, empujones, jalones de cabello, etc.).
¿Qué hacer?: Busca un lugar seguro, acude a un centro de salud si tienes lesiones, toma fotos de las lesiones, denuncia en una comisaría y solicita medidas de protección.

🧠 VIOLENCIA PSICOLÓGICA
Ocurre cuando buscan controlar, humillar o destruir tu autoestima (insultos, chantajes, celos excesivos, manipulación, vigilancia).
¿Qué hacer?: Guarda mensajes o audios amenazantes como pruebas, busca apoyo psicológico, comunícate con un CEM o denuncia por riesgo de integridad.

🚫 VIOLENCIA SEXUAL Y TOCAMIENTOS INDEBIDOS
Ocurre cuando alguien realiza actos o tocamientos sexuales sin tu consentimiento (tocamientos indebidos, violación, acoso sexual, hostigamiento, difusión de fotos íntimas sin permiso). Nadie tiene derecho a tocar tu cuerpo sin tu autorización (ni pareja, familiares o desconocidos).
¿Qué hacer?: Busca ayuda inmediatamente, guarda pruebas si existen, denuncia en una comisaría o acude a un Centro Emergencia Mujer (CEM). El silencio protege al agresor.

💰 VIOLENCIA ECONÓMICA O PATRIMONIAL
Ocurre cuando alguien controla tu dinero, te impide trabajar o estudiar, retiene tus documentos o daña tus bienes.
¿Qué hacer?: Guarda documentos y pruebas, busca orientación legal y comunícate con un CEM.

📱 VIOLENCIA DIGITAL Y ACOSO
Ocurre por internet (difundir fotos íntimas, perfiles falsos para acosarte, vigilarte, amenazarte, seguirte constantemente o llamarte repetidamente).
¿Qué hacer?: Guarda capturas de pantalla, no elimines mensajes, reporta las cuentas, bloquea al agresor cuando sea seguro y denuncia ante la autoridad pidiendo medidas de protección.

🏢 ¿DÓNDE PEDIR AYUDA?
👮 Comisaría: Recibe tu denuncia las 24 horas del día. No pueden negarse.
💜 Centro Emergencia Mujer (CEM): Orientación legal, psicológica y social gratuita.
⚖️ Poder Judicial y Fiscalía: Solicitud de medidas de protección e investigación.

📄 PASOS PARA DENUNCIAR
1. Describe lo ocurrido con tus propias palabras (no necesitas términos legales).
2. Presenta la denuncia en Comisaría, Fiscalía o Juzgado.
3. Entrega pruebas si las tienes (mensajes, audios, fotos, testigos).
4. Si no tienes pruebas, IGUAL puedes denunciar. La ley no exige pruebas para recibir tu denuncia.
5. Solicita medidas de protección (prohibición de acercamiento, comunicación, vigilancia policial).

IMPORTANTE: Esta orientación se brinda al amparo de la Ley N.° 30364 y del artículo 122-B del Código Penal.`
  }
];

async function main() {
  console.log('🌱 Iniciando la carga de datos del Perú y Base de Conocimiento...');

  // Limpiar tablas existentes
  await prisma.policeStation.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();
  await prisma.department.deleteMany();
  await prisma.knowledgeChunk.deleteMany();
  await prisma.knowledgeDocument.deleteMany();

  // --- 1. Descargar y Cargar Ubigeos Completos de Perú ---
  console.log('📡 Descargando departamentos desde GitHub...');
  const deptsRes = await fetch(DEPT_URL);
  const deptsData = await deptsRes.json() as any[];

  console.log('📡 Descargando provincias desde GitHub...');
  const provsRes = await fetch(PROV_URL);
  const provsData = await provsRes.json() as Record<string, any[]>;

  console.log('📡 Descargando distritos desde GitHub...');
  const distsRes = await fetch(DIST_URL);
  const distsData = await distsRes.json() as Record<string, any[]>;

  let totalDepts = 0;
  let totalProvs = 0;
  let totalDists = 0;

  // Mapa para relacionar el id_ubigeo de GitHub con el ID interno de nuestra Base de Datos
  const dbDeptMap: Record<string, string> = {};
  const dbProvMap: Record<string, string> = {};

  console.log('✍️  Insertando departamentos en base de datos...');
  for (const dept of deptsData) {
    const dbDept = await prisma.department.create({
      data: {
        name: dept.nombre_ubigeo,
      },
    });
    dbDeptMap[dept.id_ubigeo] = dbDept.id;
    totalDepts++;

    // Cargar provincias correspondientes
    const provincesList = provsData[dept.id_ubigeo] || [];
    for (const prov of provincesList) {
      const dbProv = await prisma.province.create({
        data: {
          name: prov.nombre_ubigeo,
          departmentId: dbDept.id,
        },
      });
      dbProvMap[prov.id_ubigeo] = dbProv.id;
      totalProvs++;

      // Cargar distritos correspondientes
      const districtsList = distsData[prov.id_ubigeo] || [];
      const distsToInsert = districtsList.map((dist) => ({
        name: dist.nombre_ubigeo,
        provinceId: dbProv.id,
      }));

      if (distsToInsert.length > 0) {
        await prisma.district.createMany({
          data: distsToInsert,
        });
        totalDists += distsToInsert.length;
      }
    }
  }

  console.log(`✅ Ubigeos del Perú cargados con éxito:`);
  console.log(`   📍 ${totalDepts} Departamentos`);
  console.log(`   📍 ${totalProvs} Provincias`);
  console.log(`   📍 ${totalDists} Distritos`);

  // --- 2. Cargar Base de Conocimiento (Mis Derechos y Orientación) ---
  console.log('✍️  Insertando documentos de base de conocimiento (Word)...');
  for (const doc of KNOWLEDGE_DOCS) {
    const dbDoc = await prisma.knowledgeDocument.create({
      data: {
        title: doc.title,
        sourceType: doc.sourceType,
        rawContent: doc.content,
      },
    });

    // Dividir contenido en fragmentos (chunks)
    const chunks = chunkText(doc.content, 400, 50);
    await prisma.knowledgeChunk.createMany({
      data: chunks.map((chunk, index) => ({
        documentId: dbDoc.id,
        content: chunk,
        chunkIndex: index,
        metadata: { source: doc.title },
      })),
    });
    console.log(`   📚 Documento "${doc.title}" creado con ${chunks.length} fragmentos.`);
  }

  // --- 3. Agregar comisarías de ejemplo en distritos clave ---
  console.log('🏛️  Insertando comisarías de ejemplo...');
  const limaCercado = await prisma.district.findFirst({
    where: {
      name: 'Lima',
      province: {
        name: 'Lima',
      },
    },
  });

  if (limaCercado) {
    await prisma.policeStation.createMany({
      data: [
        {
          name: 'Comisaría Alfonso Ugarte',
          address: 'Av. Alfonso Ugarte 980, Cercado de Lima',
          phone: '(01) 431-3140',
          districtId: limaCercado.id,
        },
        {
          name: 'Comisaría de Cotabambas',
          address: 'Jr. Cotabambas 245, Cercado de Lima',
          phone: '(01) 428-1324',
          districtId: limaCercado.id,
        },
      ],
    });
  }

  const huarazDistrict = await prisma.district.findFirst({
    where: {
      name: 'Huaraz',
      province: {
        name: 'Huaraz',
      },
    },
  });

  if (huarazDistrict) {
    await prisma.policeStation.create({
      data: {
        name: 'Comisaría Sectorial Huaraz',
        address: 'Av. Luzuriaga 450, Huaraz',
        phone: '(043) 42-1234',
        districtId: huarazDistrict.id,
      },
    });
  }

  console.log('🎉 Carga y configuración del seed finalizadas correctamente.');
}

// Utility: chunkText (mismo que usamos en la API de Knowledge para consistencia)
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }
  }

  return chunks;
}

main()
  .catch((e) => {
    console.error('❌ Carga fallida:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
