/**
 * Carga inicial: días de comida de Chile, sus fechas 2025–2028 y el admin inicial.
 * Las fechas sin fuente oficial quedan con is_confirmed = false y una nota.
 * Uso: pnpm db:seed (idempotente).
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'argon2';
import { occurrenceForYear, DateRule } from '../libs/shared/contracts/src/lib/dates';

const prisma = new PrismaClient();

interface SeedDay {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  category: 'sandwich' | 'plato' | 'dulce' | 'bebida' | 'otro';
  layers: string[];
  rule: DateRule;
  confirmed: boolean;
  sourceNote: string;
}

const DAYS: SeedDay[] = [
  {
    slug: 'dia-del-chacarero',
    name: 'Día del Chacarero',
    shortName: 'Chacarero',
    tagline: 'Porotos verdes, tomate y ají sobre carne en pan frica.',
    description:
      'El chacarero es el sánguche del campo que llegó a la ciudad: carne laminada, porotos verdes, tomate y ají verde. Las sangucherías lo celebran a mediados de febrero, cuando los porotos verdes están en plena temporada.',
    category: 'sandwich',
    layers: ['pan', 'tomate', 'porotos', 'aji', 'churrasco', 'pan'],
    rule: { dateRuleType: 'fixed', month: 2, day: 17 },
    confirmed: true,
    sourceNote: 'La Tercera (2025) lo sitúa el 17 de febrero. Fecha impulsada por sangucherías, sin decreto.',
  },
  {
    slug: 'dia-del-waffle',
    name: 'Día del Waffle',
    shortName: 'Waffle',
    tagline: 'Cuadritos dorados con manjar y frutillas.',
    description:
      'Celebración internacional que en Chile se volvió excusa para el waffle con manjar. Muchas cafeterías y heladerías aprovechan la fecha con promociones.',
    category: 'dulce',
    layers: ['frutilla', 'manjar', 'waffle', 'manjar', 'waffle'],
    rule: { dateRuleType: 'fixed', month: 3, day: 25 },
    confirmed: true,
    sourceNote: 'Día mundial del waffle, 25 de marzo (Publimetro, 2026).',
  },
  {
    slug: 'dia-de-la-cocina-chilena',
    name: 'Día de la Cocina Chilena',
    shortName: 'Cocina Chilena',
    tagline: 'Cazuela, pastel de choclo, porotos con riendas.',
    description:
      'Un día para la cocina de casa: cazuela, pastel de choclo, charquicán y todo lo que se come en la mesa larga del domingo. Restoranes y cocinerías lo usan para volver a los platos de siempre.',
    category: 'plato',
    layers: ['choclo', 'pino', 'cazuela', 'zapallo'],
    rule: { dateRuleType: 'fixed', month: 4, day: 15 },
    confirmed: false,
    sourceNote: 'Fecha difundida como 15 de abril; falta confirmar el decreto que la establece.',
  },
  {
    slug: 'dia-de-la-churrasca',
    name: 'Día de la Churrasca',
    shortName: 'Churrasca',
    tagline: 'Pan de rescoldo, mantequilla derretida.',
    description:
      'La churrasca es pan de campo cocido sobre la plancha o el rescoldo, que se come caliente con mantequilla o pebre. Es especialmente querida en el sur de Chile.',
    category: 'otro',
    layers: ['churrasca', 'mantequilla', 'churrasca'],
    rule: { dateRuleType: 'fixed', month: 5, day: 12 },
    confirmed: true,
    sourceNote: 'Redgol lo sitúa el 12 de mayo.',
  },
  {
    slug: 'dia-del-pisco',
    name: 'Día del Pisco',
    shortName: 'Pisco',
    tagline: 'Pisco sour con limón de pica y espuma.',
    description:
      'Día del pisco chileno, el destilado de uva de los valles del Elqui y del Limarí. Solo para mayores de 18 años: cualquier oferta asociada debe cumplir las reglas de publicidad de alcohol.',
    category: 'bebida',
    layers: ['espuma', 'pisco', 'limon'],
    rule: { dateRuleType: 'fixed', month: 5, day: 15 },
    confirmed: false,
    sourceNote: 'Difundido como Día Nacional del Pisco el 15 de mayo; falta fuente oficial.',
  },
  {
    slug: 'dia-del-completo',
    name: 'Día del Completo',
    shortName: 'Completo',
    tagline: 'Vienesa, tomate, palta y mayo en pan de completo.',
    description:
      'El completo italiano lleva los colores de la bandera de Italia: tomate, palta y mayonesa sobre una vienesa. Es la fecha de comida más celebrada del año, con promociones en casi todas las fuentes de soda.',
    category: 'sandwich',
    layers: ['pan', 'mayo', 'palta', 'tomate', 'vienesa', 'pan'],
    rule: { dateRuleType: 'fixed', month: 5, day: 24 },
    confirmed: true,
    sourceNote: '24 de mayo (Publimetro 2026, Redgol, La Tercera).',
  },
  {
    slug: 'dia-de-la-hamburguesa',
    name: 'Día de la Hamburguesa',
    shortName: 'Hamburguesa',
    tagline: 'Carne, queso derretido, lechuga y tomate.',
    description:
      'Fecha internacional que en Chile reúne promociones de cadenas y hamburgueserías de barrio, cuatro días después del Día del Completo.',
    category: 'sandwich',
    layers: ['pan', 'lechuga', 'tomate', 'queso', 'carne', 'pan'],
    rule: { dateRuleType: 'fixed', month: 5, day: 28 },
    confirmed: true,
    sourceNote: '28 de mayo (Publimetro 2026, Redgol).',
  },
  {
    slug: 'dia-del-barros-luco',
    name: 'Día del Barros Luco',
    shortName: 'Barros Luco',
    tagline: 'Carne y queso derretido, nada más.',
    description:
      'El sánguche que lleva el nombre del presidente Ramón Barros Luco: carne de vacuno a la plancha con queso derretido en marraqueta o pan frica.',
    category: 'sandwich',
    layers: ['marraqueta', 'queso', 'carne', 'marraqueta'],
    rule: { dateRuleType: 'fixed', month: 6, day: 9 },
    confirmed: true,
    sourceNote: 'La Tercera (2025) lo sitúa el 9 de junio. Fecha impulsada por sangucherías.',
  },
  {
    slug: 'dia-de-la-chorrillana',
    name: 'Día de la Chorrillana',
    shortName: 'Chorrillana',
    tagline: 'Papas fritas, carne, cebolla y huevo para compartir.',
    description:
      'La chorrillana nació en Valparaíso y se pide al centro de la mesa: una montaña de papas fritas con carne, cebolla caramelizada y huevo frito.',
    category: 'plato',
    layers: ['huevo', 'cebolla', 'carne', 'papas'],
    rule: { dateRuleType: 'fixed', month: 6, day: 12 },
    confirmed: true,
    sourceNote: '12 de junio (Publimetro 2026).',
  },
  {
    slug: 'dia-de-la-sopaipilla',
    name: 'Día de la Sopaipilla',
    shortName: 'Sopaipilla',
    tagline: 'Masa de zapallo frita, con pebre o pasada.',
    description:
      'La sopaipilla de zapallo se come en la calle con pebre, mostaza o ketchup, y en invierno pasada en chancaca. La fecha cae en pleno invierno, que es su temporada.',
    category: 'otro',
    layers: ['pebre', 'masa', 'zapallo', 'masa'],
    rule: { dateRuleType: 'fixed', month: 7, day: 10 },
    confirmed: true,
    sourceNote: '10 de julio (Redgol).',
  },
  {
    slug: 'dia-de-las-papas-fritas',
    name: 'Día de las Papas Fritas',
    shortName: 'Papas Fritas',
    tagline: 'Un cono de papas fritas, sal y nada más.',
    description:
      'Fecha internacional de las papas fritas, muy usada por cadenas de comida rápida para promociones de agrandado y 2x1.',
    category: 'otro',
    layers: ['papas', 'papas'],
    rule: { dateRuleType: 'fixed', month: 8, day: 20 },
    confirmed: true,
    sourceNote: '20 de agosto (Redgol).',
  },
  {
    slug: 'dia-del-vino-chileno',
    name: 'Día del Vino Chileno',
    shortName: 'Vino Chileno',
    tagline: 'Un tinto del valle central, días antes del 18.',
    description:
      'El vino chileno tiene su día a comienzos de septiembre, justo antes de Fiestas Patrias. Solo para mayores de 18 años: cualquier oferta asociada debe cumplir las reglas de publicidad de alcohol.',
    category: 'bebida',
    layers: ['vino'],
    rule: { dateRuleType: 'fixed', month: 9, day: 4 },
    confirmed: false,
    sourceNote: 'Difundido como 4 de septiembre; falta confirmar la norma que lo fija.',
  },
  {
    slug: 'dia-del-churrasco',
    name: 'Día del Churrasco',
    shortName: 'Churrasco',
    tagline: 'Carne laminada, tomate, palta y mayo.',
    description:
      'El churrasco italiano es el primo del completo: la misma bandera de tomate, palta y mayonesa, pero sobre carne laminada a la plancha.',
    category: 'sandwich',
    layers: ['pan', 'mayo', 'palta', 'tomate', 'churrasco', 'pan'],
    rule: { dateRuleType: 'fixed', month: 10, day: 20 },
    confirmed: false,
    sourceNote: 'La Tercera (2025) lo ubica entre el 19 y el 20 de octubre; se usa el 20 hasta confirmar.',
  },
  {
    slug: 'dia-del-sanguche',
    name: 'Día del Sánguche',
    shortName: 'Sánguche',
    tagline: 'Lomito, queso y lo que quieras arriba.',
    description:
      'Día mundial del sándwich. En Chile es la excusa perfecta para el lomito, el ave palta o el sánguche de potito que cada uno defiende como el mejor.',
    category: 'sandwich',
    layers: ['pan', 'lechuga', 'tomate', 'queso', 'lomito', 'pan'],
    rule: { dateRuleType: 'fixed', month: 11, day: 3 },
    confirmed: false,
    sourceNote: 'Día mundial del sándwich, 3 de noviembre (fecha internacional).',
  },
];

const YEARS = [2025, 2026, 2027, 2028];

async function main() {
  for (const d of DAYS) {
    const { rule, confirmed, ...data } = d;
    const fields = {
      ...data,
      layers: data.layers as Prisma.InputJsonValue,
      dateRuleType: rule.dateRuleType,
      month: rule.month,
      day: rule.dateRuleType === 'fixed' ? rule.day : null,
      weekday: rule.dateRuleType === 'nth_weekday' ? rule.weekday : null,
      weekOfMonth: rule.dateRuleType === 'nth_weekday' ? rule.weekOfMonth : null,
    };
    const day = await prisma.foodDay.upsert({ where: { slug: d.slug }, create: fields, update: fields });
    for (const year of YEARS) {
      const date = new Date(`${occurrenceForYear(rule, year)}T00:00:00Z`);
      await prisma.foodDayOccurrence.upsert({
        where: { foodDayId_year: { foodDayId: day.id, year } },
        create: { foodDayId: day.id, year, date, isConfirmed: confirmed },
        update: { date, isConfirmed: confirmed },
      });
    }
  }

  const email = process.env['ADMIN_EMAIL'];
  const password = process.env['ADMIN_PASSWORD'];
  if (email && password) {
    await prisma.adminUser.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase(), passwordHash: await hash(password), role: 'admin' },
      update: {},
    });
  }
  console.log(`Semilla lista: ${DAYS.length} días, años ${YEARS.join(', ')}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
