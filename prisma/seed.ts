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

/**
 * Cuántas vistas publica la tienda varía por producto: un par de zapatillas suele
 * tener 8 y se recortan a 6, pero una camiseta o una gorra pueden tener una sola.
 * Por eso `count` va explícito y verificado contra el CDN, en vez de asumir un número
 * fijo: pedir una vista que no existe deja un hueco en el carrusel del detalle.
 */
function buildImages(
  hash: string,
  gtin: string,
  date: string,
  count = 6,
  ext: 'jpg' | 'jpeg' | 'png' = 'jpg',
): string[] {
  return Array.from(
    { length: count },
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
    images: buildImages('dwb510f263', '198967044394', '20261007', 6, 'jpeg'),
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
    images: buildImages('dwffc32bcf', '194500874572', '20240126120000', 6, 'jpeg'),
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
    images: buildImages('dw2fac8462', '198728792540', '20260416', 6, 'jpeg'),
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

  // ---- Fútbol: camisetas de Alianza Lima (temporada 2026) ----
  {
    id: '198961403944',
    name: 'CAMISETA ALIANZA LIMA 2026 STADIUM',
    price: 269.9,
    description:
      'Tercera equipación 2026 de Alianza Lima para hombre, con tecnología Dri-FIT que aleja el sudor de la piel.',
    detail:
      'Tercera equipación 2026 de Alianza Lima para hombre, con tecnología Dri-FIT que aleja el sudor de la piel. Corte suelto para moverse libre en la tribuna o en la cancha, con el escudo bordado y el Swoosh aplicado.',
    images: buildImages('dwbd72fb38', '198961403944', '20260828', 1),
  },
  {
    id: '198961407690',
    name: 'CAMISETA ALIANZA LIMA 2026 STADIUM (MUJER)',
    price: 269.9,
    description:
      'La tercera equipación 2026 del club íntimo en corte para mujer, en tejido Dri-FIT ligero.',
    detail:
      'La tercera equipación 2026 del club íntimo en corte para mujer, en tejido Dri-FIT ligero. Costuras planas que no rozan y cuello acanalado que recupera la forma después de cada lavada.',
    images: buildImages('dw3b1a3785', '198961407690', '20260828', 2),
  },
  {
    id: '198961409083',
    name: 'CAMISETA ALIANZA LIMA 2026 STADIUM (NIÑOS)',
    price: 199.9,
    description:
      'La camiseta del club para niños grandes, en el mismo tejido Dri-FIT de la versión adulta.',
    detail:
      'La camiseta del club para niños grandes, en el mismo tejido Dri-FIT de la versión adulta. Resiste los lavados seguidos y se seca rápido después del partido.',
    images: buildImages('dw267ac4fb', '198961409083', '20260828', 2),
  },

  // ---- Accesorios ----
  {
    id: '196606810751',
    name: 'GORRA NIKE CLUB FUTURA WASH',
    price: 89.9,
    description:
      'Gorra desestructurada de algodón lavado, con el Futura bordado al frente y cierre ajustable.',
    detail:
      'Gorra desestructurada de algodón lavado, con el Futura bordado al frente y cierre ajustable. La copa sin estructura se amolda a la cabeza desde el primer día, sin el rigor de una gorra nueva.',
    images: buildImages('dw2c3a7d41', '196606810751', '20240129120000', 1),
  },
  {
    id: '194958681180',
    name: 'MOCHILA NIKE ELEMENTAL (21 L)',
    price: 169.9,
    description:
      'Mochila de 21 litros con compartimento acolchado para laptop y bolsillo exterior para la botella.',
    detail:
      'Mochila de 21 litros con compartimento acolchado para laptop y bolsillo exterior para la botella. Las tiras ajustables y el panel trasero acolchado reparten el peso en trayectos largos.',
    images: buildImages('dw17b2c6bd', '194958681180', '20240904', 6),
  },
  {
    id: '194954124865',
    name: 'MEDIAS NIKE EVERYDAY CUSHIONED (6 PARES)',
    price: 89.9,
    description:
      'Pack de seis pares de medias invisibles con acolchado en la planta y arco de sujeción.',
    detail:
      'Pack de seis pares de medias invisibles con acolchado en la planta y arco de sujeción. El tejido Dri-FIT mantiene el pie seco y el talón reforzado evita que se bajen dentro de la zapatilla.',
    images: buildImages('dw2e44b825', '194954124865', '20240819', 4),
  },
  {
    id: '198486719742',
    name: 'PELOTA DE FÚTBOL NIKE ACADEMY TOTAL 90',
    price: 129.9,
    description:
      'Balón de entrenamiento con cubierta resistente y gráfico Total 90 de alta visibilidad.',
    detail:
      'Balón de entrenamiento con cubierta resistente y gráfico Total 90 de alta visibilidad. Las ranuras de la superficie dan un vuelo estable y la cámara retiene el aire entre sesiones.',
    images: buildImages('dwe35e007d', '198486719742', '20251103', 2),
  },
  {
    id: '195871704628',
    name: 'CANILLERAS NIKE MERCURIAL LITE',
    price: 99.9,
    description:
      'Canilleras ligeras con carcasa curva y espuma interna, sujetas con cintas elásticas.',
    detail:
      'Canilleras ligeras con carcasa curva y espuma interna, sujetas con cintas elásticas. Pesan poco y se amoldan a la pierna, así que no hay que pelear con ellas a mitad del partido.',
    images: buildImages('dwad2ae18b', '195871704628', '20240605120000', 1, 'jpeg'),
  },

  // ---- Ropa de entrenamiento ----
  {
    id: '198727630683',
    name: 'SHORT NIKE STRIDE DRI-FIT 13 CM',
    price: 199.9,
    description:
      'Short de correr de 13 cm con forro de ropa interior y bolsillos con cierre para el celular y las llaves.',
    detail:
      'Short de correr de 13 cm con forro de ropa interior y bolsillos con cierre para el celular y las llaves. El tejido Dri-FIT seca rápido y las aberturas laterales dejan la zancada libre.',
    images: buildImages('dw750dc18b', '198727630683', '20260202', 5),
  },
  {
    id: '197860499911',
    name: 'POLO NIKE STRIDE DRI-FIT ADV',
    price: 189.9,
    description:
      'Polo de correr de manga corta con tejido Dri-FIT ADV y zonas de ventilación donde más se transpira.',
    detail:
      'Polo de correr de manga corta con tejido Dri-FIT ADV y zonas de ventilación donde más se transpira. Las costuras están colocadas fuera de los puntos de roce, para salidas largas.',
    images: buildImages('dw6affef4a', '197860499911', '20250107', 6),
  },
  {
    id: '198727064549',
    name: 'BRA DEPORTIVO NIKE SWIFT',
    price: 249.9,
    description:
      'Bra de alta sujeción con forro ligero, pensado para correr y para entrenamientos de impacto.',
    detail:
      'Bra de alta sujeción con forro ligero, pensado para correr y para entrenamientos de impacto. Las tiras ajustables y la banda ancha reparten la presión sin marcar.',
    images: buildImages('dw4db9c201', '198727064549', '20260202', 5),
  },

  // ---- Running, trail y sandalias ----
  {
    id: '198960939345',
    name: 'NIKE V2K RUN',
    price: 599.9,
    description:
      'Silueta de running de los 2000 traída a la calle, con capas metalizadas y entresuela amplia.',
    detail:
      'Silueta de running de los 2000 traída a la calle, con capas metalizadas y entresuela amplia. Malla transpirable en la capellada y unidad Air en el talón para el uso diario.',
    images: buildImages('dwa37e8892', '198960939345', '20260624', 6),
  },
  {
    id: '195866187351',
    name: 'NIKE AIR MAX 90',
    price: 639.9,
    description:
      'El Air Max 90 con su unidad Air visible, los paneles superpuestos y el Waffle de la suela.',
    detail:
      'El Air Max 90 con su unidad Air visible, los paneles superpuestos y el Waffle de la suela. Cuero y malla en la capellada, en la proporción que lo hizo un clásico desde 1990.',
    images: buildImages('dw7189a6b2', '195866187351', '20230210120000', 5, 'png'),
  },
  {
    id: '198959976870',
    name: 'NIKE ACG PEGASUS TRAIL GORE-TEX',
    price: 779.9,
    description:
      'Zapatillas de trail con membrana GORE-TEX impermeable y suela de tacos para terreno suelto.',
    detail:
      'Zapatillas de trail con membrana GORE-TEX impermeable y suela de tacos para terreno suelto. La amortiguación React aguanta las bajadas largas y el refuerzo en la puntera protege de las piedras.',
    images: buildImages('dwf28a070b', '198959976870', '20260917', 6),
  },
  {
    id: '197864030332',
    name: 'NIKE PACIFIC',
    price: 319.9,
    description:
      'Sandalias de tiras ajustables con suela acolchada, para el verano y el post-entrenamiento.',
    detail:
      'Sandalias de tiras ajustables con suela acolchada, para el verano y el post-entrenamiento. Las tiras se regulan con velcro y la plantilla contorneada sostiene el arco del pie.',
    images: buildImages('dw2351d83e', '197864030332', '20250326', 6),
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
