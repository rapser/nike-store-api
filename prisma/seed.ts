import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * El catálogo es el de nike.com.pe: nombres y precios reales (en soles) y las
 * imágenes servidas desde el CDN de la tienda, no desde el bundle del app.
 *
 * Cada producto expone 6 vistas con el patrón `<gtin>_<n>_<fecha>-mrtPeru.<ext>`;
 * `buildImages` las arma para no repetir la URL completa seis veces por producto.
 * `sw`/`sh` piden 900px, suficiente para el carrusel del detalle en pantallas 3x.
 */
const IMAGE_BASE =
  'https://www.nike.com.pe/dw/image/v2/BJKZ_PRD/on/demandware.static/-/Sites-catalog-equinox/default';

const IMAGES_PER_PRODUCT = 6;

function buildImages(
  hash: string,
  gtin: string,
  date: string,
  ext: 'jpg' | 'jpeg' = 'jpg',
): string[] {
  return Array.from(
    { length: IMAGES_PER_PRODUCT },
    (_, index) =>
      `${IMAGE_BASE}/${hash}/images/hi-res/${gtin}_${index + 1}_${date}-mrtPeru.${ext}?sw=900&sh=900`,
  );
}

/** El `id` es el GTIN del producto en la tienda peruana. Los precios son soles (PEN). */
const products = [
  {
    id: '198966744608',
    name: 'NIKE PEGASUS PLUS 2',
    price: 759.9,
    description:
      'Zapatillas de correr para hombre con amortiguación ZoomX de punta a talón, la más reactiva de Nike, sobre una parte superior Flyknit que se ajusta como un calcetín.',
    detail:
      'Zapatillas de correr para hombre con amortiguación ZoomX de punta a talón, la más reactiva de Nike, sobre una parte superior Flyknit que se ajusta como un calcetín. Pensadas para los días de ritmo rápido, devuelven energía en cada zancada sin sumar peso.',
    images: buildImages('dwf631353b', '198966744608', '20261001'),
  },
  {
    id: '198966747685',
    name: 'NIKE PEGASUS PLUS 2 (MUJER)',
    price: 759.9,
    description:
      'La versión para mujer del Pegasus Plus 2: espuma ZoomX en toda la entresuela y tejido Flyknit transpirable para entrenamientos largos.',
    detail:
      'La versión para mujer del Pegasus Plus 2: espuma ZoomX en toda la entresuela y tejido Flyknit transpirable para entrenamientos largos. La horma envolvente sujeta el pie en las curvas y el caucho de la suela agarra tanto en pista como en asfalto.',
    images: buildImages('dw302c7dcc', '198966747685', '20261001'),
  },
  {
    id: '198967044394',
    name: 'AIR JORDAN 1 HIGH OG "ROYAL"',
    price: 819.9,
    description:
      'El clásico de 1985 en su combinación negro y azul royal, con cuero premium y la unidad Air encapsulada del original.',
    detail:
      'El clásico de 1985 en su combinación negro y azul royal, con cuero premium y la unidad Air encapsulada del original. Corte alto, Swoosh cosido y el Wings en el tobillo: la silueta que empezó todo, sin retoques.',
    images: buildImages('dwb510f263', '198967044394', '20261007', 'jpeg'),
  },
  {
    id: '198959336193',
    name: 'AIR JORDAN 4 RETRO "PALE IVORY AND TOUGH RED"',
    price: 1019.9,
    description:
      'Zapatillas para mujer en marfil con detalles en rojo intenso, con las alas laterales y la malla en la lengüeta que definen al AJ4.',
    detail:
      'Zapatillas para mujer en marfil con detalles en rojo intenso, con las alas laterales y la malla en la lengüeta que definen al AJ4. Amortiguación Air visible en el talón y suela de caucho con tracción multidireccional.',
    images: buildImages('dw41722084', '198959336193', '20260923'),
  },
  {
    id: '198959334106',
    name: 'AIR JORDAN 1 LOW OG "LASER"',
    price: 749.9,
    description:
      'Corte bajo construido con los moldes originales del 85, en cuero con acabado láser y paleta sobria.',
    detail:
      'Corte bajo construido con los moldes originales del 85, en cuero con acabado láser y paleta sobria. Mantiene la entresuela de espuma y la suela de caucho del primer Air Jordan, en una versión para todos los días.',
    images: buildImages('dwfcafebf3', '198959334106', '20260901'),
  },
  {
    id: '198959723764',
    name: 'AIR JORDAN 1 RETRO LOW OG "GARDEN"',
    price: 739.9,
    description:
      'El AJ1 Low OG con bloques de color inspirados en el parquet, en cuero de primera y costuras a la vista.',
    detail:
      'El AJ1 Low OG con bloques de color inspirados en el parquet, en cuero de primera y costuras a la vista. Collar acolchado, Swoosh contrastante y la amortiguación Air encapsulada de siempre.',
    images: buildImages('dweb38778f', '198959723764', '20260917'),
  },
  {
    id: '198959336056',
    name: 'NIKE TOTAL 90',
    price: 569.9,
    description:
      'El clásico del fútbol de los 2000 reinterpretado para la calle, con capellada mixta y líneas que recuerdan a las canchas de entonces.',
    detail:
      'El clásico del fútbol de los 2000 reinterpretado para la calle, con capellada mixta y líneas que recuerdan a las canchas de entonces. Entresuela amplia y suela de caucho resistente para el uso diario.',
    images: buildImages('dw468d41d2', '198959336056', '20260624'),
  },
  {
    id: '198965069306',
    name: 'KOBE 8 PROTRO "MAMBACURIAL"',
    price: 879.9,
    description:
      'Zapatillas de básquet con la textura puntiaguda inspirada en los botines Mercurial y la amortiguación Zoom Air del Kobe 8.',
    detail:
      'Zapatillas de básquet con la textura puntiaguda inspirada en los botines Mercurial y la amortiguación Zoom Air del Kobe 8. Corte bajo y sujeción ajustada para cambios de dirección rápidos.',
    images: buildImages('dwc8aad3ca', '198965069306', '20260917'),
  },
  {
    id: '194500874572',
    name: 'NIKE AIR FORCE 1 \'07',
    price: 549.9,
    description:
      'El ícono de 1982 en cuero blanco, con la unidad Air en el talón y la suela de espiga que lo hizo inconfundible.',
    detail:
      'El ícono de 1982 en cuero blanco, con la unidad Air en el talón y la suela de espiga que lo hizo inconfundible. Costuras reforzadas, perforaciones en la puntera y el dije metálico en los cordones.',
    images: buildImages('dwffc32bcf', '194500874572', '20240126120000', 'jpeg'),
  },
  {
    id: '194500875357',
    name: 'NIKE AIR FORCE 1 MID \'07',
    price: 599.9,
    description:
      'La versión de caña media del AF1, con correa ajustable en el tobillo y el mismo cuero resistente del modelo bajo.',
    detail:
      'La versión de caña media del AF1, con correa ajustable en el tobillo y el mismo cuero resistente del modelo bajo. Amortiguación Air encapsulada y suela de caucho con el patrón de espiga original.',
    images: buildImages('dwccfb98ff', '194500875357', '20240129120000'),
  },
  {
    id: '198728792540',
    name: 'NIKE FREE METCON 7',
    price: 579.9,
    description:
      'Zapatillas de entrenamiento para mujer que combinan la flexibilidad de la suela Free con la base estable de la línea Metcon.',
    detail:
      'Zapatillas de entrenamiento para mujer que combinan la flexibilidad de la suela Free con la base estable de la línea Metcon. El talón ancho sostiene el levantamiento de pesas y la puntera flexible acompaña el trote entre series.',
    images: buildImages('dw2fac8462', '198728792540', '20260416', 'jpeg'),
  },
  {
    id: '197597039824',
    name: 'JORDAN SPIZIKE LOW',
    price: 749.9,
    description:
      'El híbrido que mezcla piezas de cinco Air Jordan distintos, ahora en corte bajo y con materiales mixtos.',
    detail:
      'El híbrido que mezcla piezas de cinco Air Jordan distintos, ahora en corte bajo y con materiales mixtos. Doble unidad Air en la entresuela y suela translúcida con tracción radial.',
    images: buildImages('dw8134fdba', '197597039824', '20260624'),
  },
  {
    id: '198730371429',
    name: 'NIKE AIR FORCE 1 \'07 LV8',
    price: 599.9,
    description:
      'El AF1 en tonos tierra, con paneles de distintos materiales y detalles premium sobre la silueta de siempre.',
    detail:
      'El AF1 en tonos tierra, con paneles de distintos materiales y detalles premium sobre la silueta de siempre. Unidad Air en el talón, collar acolchado y suela de caucho con patrón de espiga.',
    images: buildImages('dwa4a81a00', '198730371429', '20260624'),
  },
  {
    /**
     * Este id viene del catálogo dummy anterior: la fila no se puede borrar porque
     * hay pedidos que la referencian (`order_items.productId`, `onDelete: Restrict`),
     * así que en vez de dejarla con datos en USD e imágenes del bundle, se recicla
     * con un producto real de nike.com.pe. Los pedidos ya emitidos no se ven
     * afectados: `order_items` guarda su propio `shoeName` y `shoePrice`, un
     * snapshot del momento de la compra.
     */
    id: '875942-100',
    name: 'NIKE AIR FORCE 1 \'07 LV8 "DENIM"',
    price: 599.9,
    description:
      'El AF1 en gris con paneles de denim, mezclando el cuero de siempre con una textura de mezclilla.',
    detail:
      'El AF1 en gris con paneles de denim, mezclando el cuero de siempre con una textura de mezclilla. Unidad Air en el talón, collar acolchado y suela de caucho con el patrón de espiga original.',
    images: buildImages('dwa8cf707f', '198959699465', '20260624'),
  },
  {
    id: '198959700840',
    name: 'NIKE DUNK LOW RETRO PREMIUM',
    price: 599.9,
    description:
      'El Dunk Low en su versión premium, con cuero de mayor calidad y los bloques de color que vienen de las canchas universitarias.',
    detail:
      'El Dunk Low en su versión premium, con cuero de mayor calidad y los bloques de color que vienen de las canchas universitarias. Collar acolchado, lengüeta de espuma y suela de caucho duradera.',
    images: buildImages('dwdae21f80', '198959700840', '20260804'),
  },
];

const nikePlusActivities = [
  { title: 'RUNS THIS MONTH', value: '12', unit: 'runs' },
  { title: 'DISTANCE', value: '87.4', unit: 'km' },
  { title: 'BEST PACE', value: '5:32', unit: 'min/km' },
  { title: 'CALORIES', value: '4,200', unit: 'kcal' },
];

/**
 * Borra los productos que ya no están en el catálogo (los cuatro dummy en USD con
 * imágenes del bundle). `cart_items` y `favorites` caen en cascada, pero
 * `order_items` es `onDelete: Restrict` a propósito —el historial de pedidos no se
 * reescribe—, así que un producto ya comprado se deja en la base y solo se avisa.
 */
async function removeStaleProducts(keepIds: string[]) {
  const stale = await prisma.product.findMany({
    where: { id: { notIn: keepIds } },
    select: { id: true, name: true },
  });

  const kept: string[] = [];
  for (const product of stale) {
    const orderedCount = await prisma.orderItem.count({
      where: { productId: product.id },
    });
    if (orderedCount > 0) {
      kept.push(product.id);
      continue;
    }
    await prisma.product.delete({ where: { id: product.id } });
  }

  return { removed: stale.length - kept.length, keptByOrders: kept };
}

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  const stale = await removeStaleProducts(products.map((p) => p.id));

  const passwordHash = await bcrypt.hash('password123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'jordan@nike.com' },
    update: {},
    create: {
      name: 'Jordan Runner',
      email: 'jordan@nike.com',
      passwordHash,
    },
  });

  const existingActivities = await prisma.nikePlusActivity.count({
    where: { userId: demoUser.id },
  });

  if (existingActivities === 0) {
    await prisma.nikePlusActivity.createMany({
      data: nikePlusActivities.map((activity) => ({
        ...activity,
        userId: demoUser.id,
      })),
    });
  }

  console.log('Seed completed:', {
    products: products.length,
    staleRemoved: stale.removed,
    staleKeptByOrders: stale.keptByOrders,
    demoUser: demoUser.email,
    activities: nikePlusActivities.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
