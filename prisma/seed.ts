import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IMG = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Curated fashion imagery
const IMAGES = {
  panjabi1: IMG('1594938298603-c8148c4dae35'),
  panjabi2: IMG('1603252109303-2751441e0052'),
  saree1: IMG('1610030469983-98e550d6193c'),
  saree2: IMG('1583391733956-6c78276477e2'),
  saree3: IMG('1594633312681-425c7b97ccd1'),
  kurti1: IMG('1618354691373-d851c5c3a990'),
  kurti2: IMG('1583743814966-8936f5b7be1a'),
  threePiece1: IMG('1610652492500-ded49ceeb378'),
  salwar1: IMG('1595777457583-95e059d581b8'),
  lehenga1: IMG('1583935064411-7f41c23b22b1'),
  kids1: IMG('1519457431-44ccd64a579b'),
  kids2: IMG('1503919545889-aef636e10ad4'),
  mensShirt1: IMG('1602810318383-e386cc2a3ccf'),
  mensShirt2: IMG('1596755094514-f87e34085b2c'),
  mensPant1: IMG('1624378439575-d8705ad7ae80'),
  polo1: IMG('1586790170083-2f7cead4c9d3'),
  tshirt1: IMG('1521572163474-6864f9cf17ab'),
  jacket1: IMG('1551028719-00167b16eac5'),
  hijab1: IMG('1591604021695-0c69b7c05981'),
  dupatta1: IMG('1606760227091-3dd870d97f1d'),
  orna1: IMG('1620799140408-edc6dcb6d633'),
  bag1: IMG('1584917865442-de89df76afd3'),
  bag2: IMG('1548036328-c9fa89d128fa'),
  jwellery1: IMG('1535632066927-ab7c9ab60908'),
  jwellery2: IMG('1611591437281-460bfbe1220a'),
  watch1: IMG('1524592094714-0f0654e20314'),
  watch2: IMG('1522312346375-d1a52e2b99b3'),
  shoes1: IMG('1549298916-b41d501d3772'),
  shoes2: IMG('1595950653106-6c9ebd614d3a'),
  perfume1: IMG('1541643600914-78b084683601'),
  home1: IMG('1584100936595-c0654b55a2e2'),
  bedding1: IMG('1522771739844-6a9f6d5f14af'),
};

async function main() {
  console.log('🌱 Seeding BD Market...\n');

  // ─────────── Clean ───────────
  await prisma.$transaction([
    prisma.orderEvent.deleteMany(), prisma.orderItem.deleteMany(), prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(), prisma.cart.deleteMany(), prisma.wishlist.deleteMany(),
    prisma.review.deleteMany(), prisma.product.deleteMany(), prisma.category.deleteMany(),
    prisma.brand.deleteMany(), prisma.page.deleteMany(), prisma.post.deleteMany(),
    prisma.menu.deleteMany(), prisma.banner.deleteMany(), prisma.media.deleteMany(),
    prisma.setting.deleteMany(), prisma.shippingZone.deleteMany(), prisma.paymentMethod.deleteMany(),
    prisma.taxRate.deleteMany(), prisma.coupon.deleteMany(), prisma.address.deleteMany(),
    prisma.auditLog.deleteMany(), prisma.newsletter.deleteMany(), prisma.searchQuery.deleteMany(),
    prisma.pageView.deleteMany(), prisma.customer.deleteMany(), prisma.user.deleteMany(),
  ]);

  // ─────────── Users ───────────
  const adminPw = await bcrypt.hash('admin123', 10);
  const staffPw = await bcrypt.hash('staff123', 10);
  const custPw = await bcrypt.hash('customer123', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@bdmarket.com.bd', passwordHash: adminPw, name: 'Super Admin', phone: '+8801700000001', role: 'ADMIN' },
  });
  await prisma.user.create({
    data: { email: 'manager@bdmarket.com.bd', passwordHash: staffPw, name: 'Store Manager', phone: '+8801700000002', role: 'MANAGER' },
  });
  await prisma.user.create({
    data: { email: 'editor@bdmarket.com.bd', passwordHash: staffPw, name: 'Content Editor', role: 'EDITOR' },
  });

  // ─────────── Categories ───────────
  const catDefs: { name: string; nameBn: string; slug: string; icon: string; image: string; children?: any[] }[] = [
    {
      name: 'Women', nameBn: 'মহিলা', slug: 'women', icon: '👗', image: IMAGES.saree1,
      children: [
        { name: 'Saree', nameBn: 'শাড়ি', slug: 'saree', icon: '🥻', image: IMAGES.saree2 },
        { name: 'Kurti', nameBn: 'কুর্তি', slug: 'kurti', icon: '👚', image: IMAGES.kurti1 },
        { name: 'Three Piece', nameBn: 'থ্রি-পিস', slug: 'three-piece', icon: '✨', image: IMAGES.threePiece1 },
        { name: 'Salwar Kameez', nameBn: 'সালোয়ার কামিজ', slug: 'salwar-kameez', icon: '🎀', image: IMAGES.salwar1 },
        { name: 'Lehenga', nameBn: 'লেহেঙ্গা', slug: 'lehenga', icon: '💃', image: IMAGES.lehenga1 },
        { name: 'Hijab & Abaya', nameBn: 'হিজাব ও আবায়া', slug: 'hijab-abaya', icon: '🧕', image: IMAGES.hijab1 },
        { name: 'Dupatta & Orna', nameBn: 'ওড়না', slug: 'dupatta-orna', icon: '🧣', image: IMAGES.dupatta1 },
      ],
    },
    {
      name: 'Men', nameBn: 'পুরুষ', slug: 'men', icon: '👔', image: IMAGES.panjabi1,
      children: [
        { name: 'Panjabi', nameBn: 'পাঞ্জাবি', slug: 'panjabi', icon: '🕌', image: IMAGES.panjabi1 },
        { name: 'Shirt', nameBn: 'শার্ট', slug: 'shirt', icon: '👔', image: IMAGES.mensShirt1 },
        { name: 'T-Shirt & Polo', nameBn: 'টি-শার্ট ও পোলো', slug: 't-shirt-polo', icon: '👕', image: IMAGES.polo1 },
        { name: 'Pant & Trouser', nameBn: 'প্যান্ট', slug: 'pant-trouser', icon: '👖', image: IMAGES.mensPant1 },
        { name: 'Kabli & Jubba', nameBn: 'কাবলি ও জুব্বা', slug: 'kabli-jubba', icon: '🧥', image: IMAGES.jacket1 },
      ],
    },
    { name: 'Kids', nameBn: 'শিশু', slug: 'kids', icon: '🧒', image: IMAGES.kids1 },
    { name: 'Accessories', nameBn: 'এক্সেসরিজ', slug: 'accessories', icon: '👜', image: IMAGES.bag1 },
    { name: 'Jewellery', nameBn: 'গহনা', slug: 'jewellery', icon: '💍', image: IMAGES.jwellery1 },
    { name: 'Watches', nameBn: 'ঘড়ি', slug: 'watches', icon: '⌚', image: IMAGES.watch1 },
    { name: 'Shoes', nameBn: 'জুতা', slug: 'shoes', icon: '👟', image: IMAGES.shoes1 },
    { name: 'Beauty & Fragrance', nameBn: 'বিউটি ও সুগন্ধি', slug: 'beauty-fragrance', icon: '💐', image: IMAGES.perfume1 },
    { name: 'Home & Living', nameBn: 'হোম ও লিভিং', slug: 'home-living', icon: '🏠', image: IMAGES.home1 },
  ];

  const categoryMap: Record<string, string> = {};
  let catPos = 0;
  for (const c of catDefs) {
    const parent = await prisma.category.create({
      data: {
        name: c.name, nameBn: c.nameBn, slug: c.slug, icon: c.icon, image: c.image,
        position: catPos++, featured: ['women', 'men', 'jewellery'].includes(c.slug),
        metaTitle: `${c.name} Collection — ${c.nameBn} | BD Market`,
        metaDesc: `Shop premium ${c.name.toLowerCase()} collection in Bangladesh. Authentic quality, cash on delivery nationwide.`,
      },
    });
    categoryMap[c.slug] = parent.id;
    if (c.children) {
      let p = 0;
      for (const ch of c.children) {
        const child = await prisma.category.create({
          data: {
            name: ch.name, nameBn: ch.nameBn, slug: ch.slug, icon: ch.icon, image: ch.image,
            parentId: parent.id, position: p++,
            metaTitle: `${ch.name} — Buy Online in Bangladesh | BD Market`,
            metaDesc: `Buy ${ch.name.toLowerCase()} online in Bangladesh at best price. Free shipping over ৳2000.`,
          },
        });
        categoryMap[ch.slug] = child.id;
      }
    }
  }
  console.log(`  ✓ ${Object.keys(categoryMap).length} categories`);

  // ─────────── Brands ───────────
  const brands = [
    { name: 'Aarong', slug: 'aarong', country: 'Bangladesh', featured: true, description: 'Iconic Bangladeshi lifestyle brand by BRAC.' },
    { name: 'Yellow', slug: 'yellow', country: 'Bangladesh', featured: true, description: 'Contemporary Bangladeshi fashion label.' },
    { name: 'Sailor', slug: 'sailor', country: 'Bangladesh', featured: true },
    { name: 'Dorjibari', slug: 'dorjibari', country: 'Bangladesh', featured: true },
    { name: 'Ecstasy', slug: 'ecstasy', country: 'Bangladesh' },
    { name: 'Rang Bangladesh', slug: 'rang-bangladesh', country: 'Bangladesh' },
    { name: 'Kay Kraft', slug: 'kay-kraft', country: 'Bangladesh', featured: true },
    { name: 'Anjan\'s', slug: 'anjans', country: 'Bangladesh' },
    { name: 'Le Reve', slug: 'le-reve', country: 'Bangladesh' },
    { name: 'Infinity', slug: 'infinity', country: 'Bangladesh' },
  ];
  const brandMap: Record<string, string> = {};
  for (const b of brands) {
    const row = await prisma.brand.create({ data: b });
    brandMap[b.slug] = row.id;
  }
  console.log(`  ✓ ${brands.length} brands`);

  // ─────────── Products ───────────
  type P = {
    name: string; nameBn: string; sku: string; price: number; compare?: number; cost?: number;
    cat: string; brand: string; imgs: string[]; desc: string; short: string;
    stock: number; tags: string; fabric?: string; occasion?: string; fit?: string;
    featured?: boolean; bestseller?: boolean; sizes?: string[]; colors?: string[];
    rating?: number; reviews?: number; sold?: number;
  };

  const products: P[] = [
    // ── Panjabi ──
    { name: 'Premium Embroidered Cotton Panjabi', nameBn: 'প্রিমিয়াম এমব্রয়ডারি কটন পাঞ্জাবি', sku: 'BDM-PNJ-001', price: 2450, compare: 3200, cost: 1400, cat: 'panjabi', brand: 'aarong', imgs: [IMAGES.panjabi1, IMAGES.panjabi2, IMAGES.mensShirt1], stock: 48, featured: true, bestseller: true, rating: 4.8, reviews: 126, sold: 412, sizes: ['S','M','L','XL','XXL'], colors: ['White','Navy','Maroon'], fabric: '100% Cotton', occasion: 'Eid, Wedding, Festive', fit: 'Regular Fit', tags: 'panjabi,eid,traditional,men', short: 'Hand-embroidered cotton panjabi with mandarin collar — ideal for Eid and festive occasions.', desc: 'Crafted from premium 100% cotton with intricate hand embroidery on the placket and collar. Features a classic mandarin collar, full button placket and side vents for ease of movement. Breathable fabric makes it comfortable for long festive days.\n\n- Fabric: 100% Premium Cotton\n- Collar: Mandarin\n- Sleeve: Full Sleeve\n- Fit: Regular Fit\n- Care: Machine wash cold, do not bleach' },
    { name: 'Silk Blend Festive Panjabi', nameBn: 'সিল্ক ব্লেন্ড ফেস্টিভ পাঞ্জাবি', sku: 'BDM-PNJ-002', price: 3890, compare: 4800, cost: 2200, cat: 'panjabi', brand: 'dorjibari', imgs: [IMAGES.panjabi2, IMAGES.panjabi1], stock: 24, featured: true, rating: 4.7, reviews: 68, sold: 187, sizes: ['M','L','XL','XXL'], colors: ['Cream','Black','Teal'], fabric: 'Silk Blend', occasion: 'Wedding, Reception', tags: 'panjabi,silk,wedding', short: 'Lustrous silk-blend panjabi with subtle self-texture — perfect for weddings.', desc: 'A refined silk-blend panjabi with a soft sheen and self-textured weave. Tailored for wedding and reception wear with a structured shoulder and clean silhouette.\n\n- Fabric: Silk Blend\n- Fit: Slim Fit\n- Care: Dry clean recommended' },
    { name: 'Casual Printed Cotton Panjabi', nameBn: 'ক্যাজুয়াল প্রিন্টেড কটন পাঞ্জাবি', sku: 'BDM-PNJ-003', price: 1690, compare: 2200, cost: 950, cat: 'panjabi', brand: 'sailor', imgs: [IMAGES.panjabi1, IMAGES.mensShirt2], stock: 62, bestseller: true, rating: 4.5, reviews: 94, sold: 356, sizes: ['S','M','L','XL'], colors: ['Grey','Olive','Blue'], fabric: 'Cotton', occasion: 'Casual, Daily', tags: 'panjabi,casual,daily', short: 'Everyday cotton panjabi with a modern block print — comfortable and affordable.', desc: 'Lightweight printed cotton panjabi designed for daily wear. Soft hand-feel, easy to wash and holds colour well after repeated washes.' },
    { name: 'Embroidered Karchupi Panjabi', nameBn: 'কারচুপি পাঞ্জাবি', sku: 'BDM-PNJ-004', price: 5450, compare: 6800, cost: 3200, cat: 'kabli-jubba', brand: 'kay-kraft', imgs: [IMAGES.jacket1, IMAGES.panjabi2], stock: 12, featured: true, rating: 4.9, reviews: 42, sold: 96, sizes: ['M','L','XL'], colors: ['Deep Maroon','Off White'], fabric: 'Viscose Silk', occasion: 'Wedding, Eid', tags: 'karchupi,panjabi,luxury', short: 'Hand karchupi work with zardozi detailing — a statement festive piece.', desc: 'Exquisitely hand-embroidered karchupi panjabi with zardozi and sequin detailing along the placket and cuffs. A heirloom-quality festive piece.\n\n- Fabric: Viscose Silk\n- Embellishment: Hand Karchupi + Zardozi\n- Care: Dry clean only' },

    // ── Saree ──
    { name: 'Jamdani Handloom Saree', nameBn: 'জামদানি হ্যান্ডলুম শাড়ি', sku: 'BDM-SAR-001', price: 8500, compare: 12000, cost: 5200, cat: 'saree', brand: 'aarong', imgs: [IMAGES.saree1, IMAGES.saree2, IMAGES.saree3], stock: 18, featured: true, bestseller: true, rating: 4.9, reviews: 214, sold: 512, colors: ['Red','Navy','Green','Peach'], fabric: 'Handloom Cotton Silk', occasion: 'Wedding, Pohela Boishakh', tags: 'jamdani,saree,handloom,traditional,gi', short: 'Authentic handwoven Jamdani from Narayanganj weavers — a Bangladeshi heritage piece.', desc: 'Genuine handwoven Jamdani saree crafted by master weavers of Narayanganj. The intricate discontinuous supplementary weft technique creates floating motifs that appear to hover over the fabric.\n\n- Weave: Handloom Jamdani\n- Origin: Narayanganj, Bangladesh\n- Length: 12 haat with blouse piece\n- Care: Dry clean only' },
    { name: 'Katan Silk Saree with Zari Border', nameBn: 'কাতান সিল্ক শাড়ি', sku: 'BDM-SAR-002', price: 11200, compare: 15000, cost: 7000, cat: 'saree', brand: 'rang-bangladesh', imgs: [IMAGES.saree2, IMAGES.saree1], stock: 9, featured: true, rating: 4.8, reviews: 87, sold: 143, colors: ['Deep Red','Royal Blue','Bottle Green'], fabric: 'Katan Silk', occasion: 'Wedding, Reception', tags: 'katan,silk,saree,wedding', short: 'Pure Katan silk with real zari border — a timeless wedding saree.', desc: 'Woven in pure Katan silk with an opulent zari border and pallu. The crisp texture and rich drape make it a classic choice for weddings.\n\n- Fabric: Pure Katan Silk\n- Border: Real Zari\n- Care: Dry clean only' },
    { name: 'Soft Cotton Tant Saree', nameBn: 'সফট কটন তাঁতের শাড়ি', sku: 'BDM-SAR-003', price: 2350, compare: 3100, cost: 1350, cat: 'saree', brand: 'yellow', imgs: [IMAGES.saree3, IMAGES.saree2], stock: 55, bestseller: true, rating: 4.6, reviews: 178, sold: 624, colors: ['Sky Blue','Yellow','Pink','White'], fabric: 'Pure Cotton Tant', occasion: 'Daily, Office, Casual', tags: 'tant,cotton,saree,daily', short: 'Breathable tant cotton saree — comfortable all day, easy to drape.', desc: 'Classic Bengal tant saree in soft combed cotton. Lightweight, breathable and easy to maintain — a daily-wear essential for Bangladeshi women.' },
    { name: 'Georgette Party Saree with Sequins', nameBn: 'জর্জেট পার্টি শাড়ি', sku: 'BDM-SAR-004', price: 4200, compare: 5500, cost: 2500, cat: 'saree', brand: 'ecstasy', imgs: [IMAGES.saree1, IMAGES.lehenga1], stock: 31, rating: 4.4, reviews: 63, sold: 198, colors: ['Wine','Black','Teal'], fabric: 'Georgette', occasion: 'Party, Reception', tags: 'georgette,party,saree,sequins', short: 'Flowy georgette saree with sequin work — made for evening parties.', desc: 'A flowing georgette saree with scattered sequin embellishment and a scalloped border. Comes with unstitched blouse piece.' },
    { name: 'Muslin Jamdani Bridal Saree', nameBn: 'মসলিন জামদানি ব্রাইডাল শাড়ি', sku: 'BDM-SAR-005', price: 24500, compare: 32000, cost: 15000, cat: 'saree', brand: 'aarong', imgs: [IMAGES.saree2, IMAGES.saree1, IMAGES.lehenga1], stock: 4, featured: true, rating: 5.0, reviews: 29, sold: 41, colors: ['Ivory','Gold'], fabric: 'Handwoven Muslin', occasion: 'Bridal, Wedding', tags: 'muslin,bridal,saree,luxury,wedding', short: 'Heirloom muslin Jamdani — the finest bridal weave of Bangladesh.', desc: 'An extraordinary bridal piece woven from ultra-fine muslin yarn in the traditional Jamdani technique. Takes 45+ days on the loom. Limited production.\n\n- Weave: Handloom Muslin Jamdani\n- Weave time: 45+ days\n- Care: Dry clean only, store in muslin cloth' },

    // ── Kurti ──
    { name: 'Embroidered Cotton Kurti', nameBn: 'এমব্রয়ডারি কটন কুর্তি', sku: 'BDM-KRT-001', price: 1450, compare: 1950, cost: 780, cat: 'kurti', brand: 'yellow', imgs: [IMAGES.kurti1, IMAGES.kurti2], stock: 88, featured: true, bestseller: true, rating: 4.7, reviews: 231, sold: 874, sizes: ['S','M','L','XL','XXL'], colors: ['White','Mustard','Teal','Pink'], fabric: 'Cotton', occasion: 'Daily, Office', tags: 'kurti,cotton,embroidered,daily', short: 'Soft cotton kurti with delicate thread embroidery on the yoke.', desc: 'A wardrobe staple — soft cotton kurti with intricate thread embroidery on the yoke and a comfortable straight cut. Pairs well with jeans, palazzo or leggings.' },
    { name: 'Rayon Printed A-Line Kurti', nameBn: 'রেয়ন প্রিন্টেড এ-লাইন কুর্তি', sku: 'BDM-KRT-002', price: 1190, compare: 1590, cost: 650, cat: 'kurti', brand: 'sailor', imgs: [IMAGES.kurti2, IMAGES.kurti1], stock: 120, bestseller: true, rating: 4.5, reviews: 187, sold: 1032, sizes: ['S','M','L','XL','XXL','3XL'], colors: ['Blue','Green','Maroon','Black'], fabric: 'Rayon', occasion: 'Casual, Daily', tags: 'kurti,rayon,printed,alina', short: 'Flowy A-line rayon kurti with vibrant block prints — all-day comfort.', desc: 'Breathable rayon kurti in a flattering A-line silhouette with side pockets and vibrant hand-block prints. Machine washable.' },
    { name: 'Chikankari Kurti with Lace Detail', nameBn: 'চিকনকারি কুর্তি', sku: 'BDM-KRT-003', price: 2250, compare: 2900, cost: 1300, cat: 'kurti', brand: 'kay-kraft', imgs: [IMAGES.kurti1, IMAGES.threePiece1], stock: 42, rating: 4.6, reviews: 76, sold: 214, sizes: ['S','M','L','XL'], colors: ['White','Pastel Blue','Peach'], fabric: 'Cotton', occasion: 'Office, Semi-formal', tags: 'chikankari,kurti,embroidery', short: 'Fine chikankari hand embroidery with crochet lace trims.', desc: 'Delicate chikankari embroidery covers the front panel, finished with crochet lace on the hem and sleeves. Elegant yet understated.' },
    { name: 'Kurti with Palazzo Set', nameBn: 'কুর্তি ও প্যালাজো সেট', sku: 'BDM-KRT-004', price: 2650, compare: 3400, cost: 1550, cat: 'salwar-kameez', brand: 'rang-bangladesh', imgs: [IMAGES.threePiece1, IMAGES.kurti2], stock: 36, featured: true, rating: 4.6, reviews: 58, sold: 176, sizes: ['S','M','L','XL'], colors: ['Olive','Navy','Rust'], fabric: 'Cotton Silk', occasion: 'Office, Party', tags: 'kurti,palazzo,set,co-ord', short: 'Coordinated kurti + palazzo set — ready to wear, zero styling effort.', desc: 'A coordinated two-piece set with a straight-cut kurti and matching flared palazzo. Made from a cotton-silk blend that drapes beautifully.' },

    // ── Three piece / salwar ──
    { name: 'Unstitched Three Piece Salwar Kameez', nameBn: 'আনস্টিচড থ্রি-পিস', sku: 'BDM-TPS-001', price: 3250, compare: 4200, cost: 1900, cat: 'three-piece', brand: 'aarong', imgs: [IMAGES.threePiece1, IMAGES.salwar1], stock: 44, featured: true, rating: 4.7, reviews: 142, sold: 388, colors: ['Teal','Mustard','Purple'], fabric: 'Cotton', occasion: 'Festive, Daily', tags: 'threepiece,salwar,unstitched', short: 'Complete unstitched three-piece with kameez, salwar and dupatta.', desc: 'Three-piece unstitched set containing printed kameez fabric (2.5 haat), salwar fabric (2.5 haat) and a matching dupatta. Print designed in-house.' },
    { name: 'Embroidered Georgette Three Piece', nameBn: 'এমব্রয়ডারি জর্জেট থ্রি-পিস', sku: 'BDM-TPS-002', price: 4890, compare: 6200, cost: 2900, cat: 'three-piece', brand: 'le-reve', imgs: [IMAGES.salwar1, IMAGES.threePiece1], stock: 27, bestseller: true, rating: 4.8, reviews: 91, sold: 246, colors: ['Wine','Emerald','Powder Blue'], fabric: 'Georgette', occasion: 'Party, Reception', tags: 'georgette,threepiece,embroidered', short: 'Heavily embroidered georgette three-piece with net dupatta.', desc: 'Georgette kameez with dense thread and sequin embroidery, paired with santoon salwar and a net dupatta with sequin border.' },
    { name: 'Cotton Salwar Kameez Stitched Set', nameBn: 'কটন সালোয়ার কামিজ সেট', sku: 'BDM-SLK-001', price: 2790, compare: 3600, cost: 1600, cat: 'salwar-kameez', brand: 'sailor', imgs: [IMAGES.salwar1, IMAGES.kurti1], stock: 51, rating: 4.4, reviews: 67, sold: 189, sizes: ['S','M','L','XL','XXL'], colors: ['Blue','Green','White'], fabric: 'Cotton', occasion: 'Daily, Office', tags: 'salwar,kameez,stitched,cotton', short: 'Ready-to-wear cotton salwar kameez — comfortable and practical.', desc: 'Pre-stitched salwar kameez in breathable cotton. Features a straight kameez with side slits, elasticated salwar and printed dupatta.' },
    { name: 'Designer Party Lehenga Choli', nameBn: 'ডিজাইনার লেহেঙ্গা চোলি', sku: 'BDM-LHG-001', price: 8900, compare: 12500, cost: 5400, cat: 'lehenga', brand: 'ecstasy', imgs: [IMAGES.lehenga1, IMAGES.saree1], stock: 11, featured: true, rating: 4.7, reviews: 38, sold: 84, sizes: ['S','M','L','XL'], colors: ['Red','Royal Blue','Gold'], fabric: 'Velvet & Net', occasion: 'Wedding, Party', tags: 'lehenga,choli,party,wedding', short: 'Flared lehenga with embroidered choli and net dupatta.', desc: 'A dramatic flared lehenga with heavy embroidery on the choli and a soft net dupatta with sequin work. Comes semi-stitched for a tailored fit.' },

    // ── Hijab & Abaya ──
    { name: 'Premium Georgette Hijab', nameBn: 'প্রিমিয়াম জর্জেট হিজাব', sku: 'BDM-HJB-001', price: 690, compare: 950, cost: 350, cat: 'hijab-abaya', brand: 'infinity', imgs: [IMAGES.hijab1, IMAGES.dupatta1], stock: 210, featured: true, bestseller: true, rating: 4.8, reviews: 312, sold: 1450, colors: ['Black','Navy','Beige','Maroon','Emerald'], fabric: 'Georgette', occasion: 'Daily', tags: 'hijab,georgette,modest', short: 'Non-slip georgette hijab — soft, opaque and easy to style.', desc: 'Premium georgette hijab with a matte finish, non-slip texture and generous size (180cm x 75cm). Colour-fast and machine washable.' },
    { name: 'Embroidered Nida Abaya', nameBn: 'এমব্রয়ডারি নিদা আবায়া', sku: 'BDM-ABY-001', price: 3450, compare: 4600, cost: 2000, cat: 'hijab-abaya', brand: 'le-reve', imgs: [IMAGES.hijab1, IMAGES.jacket1], stock: 33, featured: true, rating: 4.7, reviews: 74, sold: 212, sizes: ['S','M','L','XL'], colors: ['Black','Brown','Grey'], fabric: 'Nida', occasion: 'Daily, Office', tags: 'abaya,nida,modest,burqa', short: 'Flowing nida abaya with tonal embroidery at the cuffs.', desc: 'A graceful nida abaya with a relaxed A-line cut, concealed front zip and tonal thread embroidery at the sleeve cuffs. Includes matching scarf.' },

    // ── Men shirt/pant ──
    { name: 'Oxford Formal Shirt', nameBn: 'অক্সফোর্ড ফরমাল শার্ট', sku: 'BDM-SHT-001', price: 1790, compare: 2400, cost: 980, cat: 'shirt', brand: 'anjans', imgs: [IMAGES.mensShirt1, IMAGES.mensShirt2], stock: 76, featured: true, bestseller: true, rating: 4.6, reviews: 156, sold: 512, sizes: ['S','M','L','XL','XXL'], colors: ['White','Sky','Grey','Navy'], fabric: 'Oxford Cotton', occasion: 'Office, Formal', tags: 'shirt,formal,oxford,office', short: 'Crisp oxford cotton shirt with a structured collar — office-ready.', desc: 'Woven from durable oxford cotton with a semi-cutaway collar, single cuff and mother-of-pearl buttons. Wrinkle-resistant finish.' },
    { name: 'Slim Fit Stretch Chino Pant', nameBn: 'স্লিম ফিট চিনো প্যান্ট', sku: 'BDM-PNT-001', price: 2190, compare: 2900, cost: 1250, cat: 'pant-trouser', brand: 'yellow', imgs: [IMAGES.mensPant1, IMAGES.mensShirt1], stock: 64, rating: 4.5, reviews: 98, sold: 341, sizes: ['30','32','34','36','38'], colors: ['Khaki','Navy','Black','Olive'], fabric: 'Cotton Twill with Stretch', occasion: 'Casual, Office', tags: 'pant,chino,slimfit,trouser', short: 'Stretch chino with a clean slim leg — comfort meets polish.', desc: 'Cotton twill chino with 2% elastane for all-day comfort. Features a clean slim leg, slant pockets and a hidden coin pocket.' },
    { name: 'Pique Cotton Polo Shirt', nameBn: 'পিকে কটন পোলো শার্ট', sku: 'BDM-PLO-001', price: 1250, compare: 1750, cost: 680, cat: 't-shirt-polo', brand: 'sailor', imgs: [IMAGES.polo1, IMAGES.tshirt1], stock: 145, bestseller: true, rating: 4.5, reviews: 203, sold: 786, sizes: ['S','M','L','XL','XXL'], colors: ['White','Black','Maroon','Forest'], fabric: 'Pique Cotton', occasion: 'Casual', tags: 'polo,pique,casual', short: 'Classic pique polo with ribbed collar and cuffs.', desc: 'Breathable pique cotton polo with a ribbed collar, two-button placket and side vents. Holds shape wash after wash.' },
    { name: 'Graphic Print Cotton T-Shirt', nameBn: 'গ্রাফিক প্রিন্ট টি-শার্ট', sku: 'BDM-TSH-001', price: 790, compare: 1150, cost: 400, cat: 't-shirt-polo', brand: 'infinity', imgs: [IMAGES.tshirt1, IMAGES.polo1], stock: 220, bestseller: true, rating: 4.4, reviews: 289, sold: 1240, sizes: ['S','M','L','XL','XXL'], colors: ['White','Navy','Charcoal'], fabric: 'Combed Cotton', occasion: 'Casual', tags: 'tshirt,graphic,cotton,casual', short: 'Soft combed cotton tee with a water-based print.', desc: '180 GSM combed cotton t-shirt with a soft water-based graphic print that will not crack or peel. Pre-shrunk for a consistent fit.' },

    // ── Kids ──
    { name: 'Kids Festive Panjabi Set', nameBn: 'শিশুদের ফেস্টিভ পাঞ্জাবি সেট', sku: 'BDM-KID-001', price: 1490, compare: 2000, cost: 850, cat: 'kids', brand: 'dorjibari', imgs: [IMAGES.kids1, IMAGES.kids2], stock: 58, featured: true, rating: 4.7, reviews: 84, sold: 267, sizes: ['2-3Y','4-5Y','6-7Y','8-9Y','10-11Y'], colors: ['White','Cream','Sky'], fabric: 'Cotton', occasion: 'Eid, Festive', tags: 'kids,panjabi,eid,children', short: 'Adorable festive panjabi set for boys — soft cotton, easy to wear.', desc: 'Kids festive panjabi with matching pyjama. Made from soft, skin-friendly cotton with smooth seams and easy buttons for quick dressing.' },
    { name: 'Girls Party Frock', nameBn: 'মেয়েদের পার্টি ফ্রক', sku: 'BDM-KID-002', price: 1890, compare: 2500, cost: 1100, cat: 'kids', brand: 'yellow', imgs: [IMAGES.kids2, IMAGES.kids1], stock: 47, rating: 4.6, reviews: 61, sold: 189, sizes: ['2-3Y','4-5Y','6-7Y','8-9Y'], colors: ['Pink','Peach','Lavender'], fabric: 'Satin & Net', occasion: 'Party, Birthday', tags: 'kids,frock,girls,party', short: 'Layered satin-net frock with bow detail — party ready.', desc: 'A twirl-worthy party frock with a satin bodice, layered net skirt and a statement bow at the waist. Fully lined for comfort.' },

    // ── Accessories / bags ──
    { name: 'Handcrafted Leather Handbag', nameBn: 'হাতে তৈরি লেদার হ্যান্ডব্যাগ', sku: 'BDM-BAG-001', price: 3890, compare: 5200, cost: 2200, cat: 'accessories', brand: 'le-reve', imgs: [IMAGES.bag1, IMAGES.bag2], stock: 22, featured: true, rating: 4.7, reviews: 73, sold: 156, colors: ['Tan','Black','Brown'], fabric: 'Genuine Leather', occasion: 'Daily, Office', tags: 'bag,leather,handbag,handcrafted', short: 'Vegetable-tanned leather handbag made by Bangladeshi artisans.', desc: 'Hand-stitched from vegetable-tanned cowhide leather by artisans in Bhairab. Features a lined interior, zip pocket and adjustable shoulder strap. Develops a rich patina over time.' },
    { name: 'Jute Tote Bag with Print', nameBn: 'পাটের টোট ব্যাগ', sku: 'BDM-BAG-002', price: 890, compare: 1250, cost: 450, cat: 'accessories', brand: 'rang-bangladesh', imgs: [IMAGES.bag2, IMAGES.bag1], stock: 165, rating: 4.5, reviews: 118, sold: 542, colors: ['Natural','Printed'], fabric: '100% Jute', occasion: 'Daily, Eco', tags: 'jute,bag,eco,handmade,bangladesh', short: 'Eco-friendly Bangladeshi jute tote — sturdy, reusable, sustainable.', desc: 'Made from 100% natural Bangladeshi jute with reinforced handles and a laminated inner lining. A sustainable alternative to plastic bags.' },

    // ── Jewellery / watches ──
    { name: 'Traditional Gold Plated Jewellery Set', nameBn: 'ঐতিহ্যবাহী গোল্ড প্লেটেড গহনা সেট', sku: 'BDM-JWL-001', price: 3450, compare: 4800, cost: 1900, cat: 'jewellery', brand: 'kay-kraft', imgs: [IMAGES.jwellery1, IMAGES.jwellery2], stock: 38, featured: true, bestseller: true, rating: 4.8, reviews: 164, sold: 428, colors: ['Gold','Rose Gold'], fabric: 'Brass with Gold Plating', occasion: 'Wedding, Festive', tags: 'jewellery,set,goldplated,bridal', short: 'Complete gold-plated set — necklace, earrings, tikka and bangles.', desc: 'Traditional bridal-inspired jewellery set including choker necklace, matching jhumar earrings, tikka and a pair of bangles. Anti-tarnish gold plating over brass.' },
    { name: 'Kundan Choker Necklace', nameBn: 'কুন্দন চোকার নেকলেস', sku: 'BDM-JWL-002', price: 2250, compare: 3100, cost: 1250, cat: 'jewellery', brand: 'ecstasy', imgs: [IMAGES.jwellery2, IMAGES.jwellery1], stock: 44, rating: 4.6, reviews: 87, sold: 231, colors: ['Gold-White','Gold-Green','Gold-Red'], occasion: 'Party, Wedding', tags: 'kundan,choker,necklace', short: 'Kundan choker with pearl drops and meenakari work on the reverse.', desc: 'A statement kundan choker featuring uncut stones, pearl drops and detailed meenakari enamel work on the reverse side.' },
    { name: 'Analog Leather Strap Watch', nameBn: 'অ্যানালগ লেদার স্ট্র্যাপ ঘড়ি', sku: 'BDM-WCH-001', price: 4290, compare: 6200, cost: 2600, cat: 'watches', brand: 'ecstasy', imgs: [IMAGES.watch1, IMAGES.watch2], stock: 26, featured: true, rating: 4.6, reviews: 94, sold: 187, colors: ['Brown','Black'], occasion: 'Formal, Daily', tags: 'watch,leather,analog,men', short: 'Minimal analog watch with a genuine leather strap — 3ATM water resistant.', desc: 'Slim 40mm stainless steel case with a mineral crystal, Japanese quartz movement and a genuine leather strap. 3ATM water resistant.' },
    { name: 'Smart Fitness Band', nameBn: 'স্মার্ট ফিটনেস ব্যান্ড', sku: 'BDM-WCH-002', price: 2890, compare: 4500, cost: 1700, cat: 'watches', brand: 'infinity', imgs: [IMAGES.watch2, IMAGES.watch1], stock: 71, bestseller: true, rating: 4.3, reviews: 142, sold: 492, colors: ['Black','Blue','Pink'], occasion: 'Sports, Daily', tags: 'smartwatch,band,fitness', short: 'Colour display fitness band with heart rate and SpO2 tracking.', desc: '1.47" colour display fitness band tracking heart rate, SpO2, sleep and 60+ sport modes. IP68 water resistant with 10-day battery life.' },

    // ── Shoes ──
    { name: 'Leather Formal Oxford Shoes', nameBn: 'লেদার ফরমাল অক্সফোর্ড জুতা', sku: 'BDM-SHO-001', price: 3990, compare: 5400, cost: 2300, cat: 'shoes', brand: 'anjans', imgs: [IMAGES.shoes1, IMAGES.shoes2], stock: 34, featured: true, rating: 4.7, reviews: 106, sold: 243, sizes: ['39','40','41','42','43','44'], colors: ['Black','Brown'], occasion: 'Formal, Office', tags: 'shoes,leather,formal,oxford', short: 'Genuine leather oxford with cushioned insole — made in Bangladesh.', desc: 'Classic leather oxford with a stitched leather sole, cushioned memory-foam insole and a burnished toe. Locally crafted by Bangladeshi shoemakers.' },
    { name: 'Running Sports Sneakers', nameBn: 'রানিং স্পোর্টস স্নিকার্স', sku: 'BDM-SHO-002', price: 2650, compare: 3800, cost: 1500, cat: 'shoes', brand: 'infinity', imgs: [IMAGES.shoes2, IMAGES.shoes1], stock: 88, bestseller: true, rating: 4.5, reviews: 178, sold: 541, sizes: ['38','39','40','41','42','43','44'], colors: ['Black','White','Grey'], occasion: 'Sports, Casual', tags: 'shoes,sneakers,running,sports', short: 'Lightweight mesh sneakers with a shock-absorbing sole.', desc: 'Breathable knit-mesh upper with a moulded EVA midsole for impact absorption. Non-slip rubber outsole and padded ankle collar.' },

    // ── Beauty ──
    { name: 'Attar Oil Perfume — 12ml', nameBn: 'আতর পারফিউম ১২ মিলি', sku: 'BDM-PRF-001', price: 1250, compare: 1800, cost: 680, cat: 'beauty-fragrance', brand: 'rang-bangladesh', imgs: [IMAGES.perfume1, IMAGES.jwellery1], stock: 132, featured: true, rating: 4.7, reviews: 187, sold: 612, colors: ['Oud','Musk','Rose'], occasion: 'Daily, Gift', tags: 'attar,perfume,fragrance,alcoholfree', short: 'Alcohol-free concentrated attar oil — long-lasting, halal friendly.', desc: 'Traditional alcohol-free attar oil in a 12ml roll-on bottle. Concentrated formula gives 8–10 hours of wear. Available in Oud, Musk and Rose.' },
    { name: 'Herbal Skincare Gift Set', nameBn: 'হারবাল স্কিনকেয়ার গিফট সেট', sku: 'BDM-BTY-001', price: 1890, compare: 2600, cost: 1000, cat: 'beauty-fragrance', brand: 'aarong', imgs: [IMAGES.jwellery1, IMAGES.perfume1], stock: 64, rating: 4.6, reviews: 92, sold: 218, occasion: 'Gift, Daily', tags: 'skincare,herbal,giftset,organic', short: 'Neem, turmeric and aloe-based skincare set — 100% herbal.', desc: 'A four-piece herbal skincare set: neem face wash, turmeric brightening mask, aloe moisturiser and rose water toner. Paraben and sulphate free.' },

    // ── Home ──
    { name: 'Handloom Cotton Bed Cover Set', nameBn: 'হ্যান্ডলুম কটন বেড কভার সেট', sku: 'BDM-HOM-001', price: 3290, compare: 4500, cost: 1850, cat: 'home-living', brand: 'rang-bangladesh', imgs: [IMAGES.bedding1, IMAGES.home1], stock: 41, featured: true, rating: 4.6, reviews: 78, sold: 194, sizes: ['Single','Double','King'], colors: ['Teal','Grey','Rust'], fabric: 'Handloom Cotton', occasion: 'Home', tags: 'bedcover,home,handloom,cotton', short: 'Handwoven cotton bed cover with 2 pillow covers — breathable and durable.', desc: 'Handwoven on traditional Bangladeshi looms. Includes one double bed cover (220x240cm) and two pillow covers. Colour-fast and machine washable.' },
    { name: 'Nakshi Kantha Cushion Cover Set', nameBn: 'নকশি কাঁথা কুশন কভার', sku: 'BDM-HOM-002', price: 1490, compare: 2100, cost: 800, cat: 'home-living', brand: 'aarong', imgs: [IMAGES.home1, IMAGES.bedding1], stock: 73, rating: 4.8, reviews: 94, sold: 287, colors: ['Multi','Red','Blue'], fabric: 'Cotton with Kantha Stitch', occasion: 'Home, Gift', tags: 'nakshikantha,cushion,handmade,home', short: 'Set of 4 Nakshi Kantha cushion covers — traditional Bangladeshi craft.', desc: 'Set of four cushion covers featuring authentic Nakshi Kantha running stitch embroidery, hand-stitched by women artisans in Jamalpur. 45x45cm.' },
    { name: 'Terracotta Tea Set', nameBn: 'টেরাকোটা চা সেট', sku: 'BDM-HOM-003', price: 990, compare: 1400, cost: 520, cat: 'home-living', brand: 'rang-bangladesh', imgs: [IMAGES.home1, IMAGES.bedding1], stock: 96, rating: 4.5, reviews: 64, sold: 231, colors: ['Natural Terracotta'], fabric: 'Terracotta Clay', occasion: 'Home, Gift', tags: 'terracotta,teaset,clay,craft', short: 'Handmade terracotta tea set — 6 cups with saucers and a teapot.', desc: 'Traditional Bangladeshi terracotta tea set, wheel-thrown and kiln-fired by artisans. Includes 6 cups, 6 saucers and a teapot. Food-safe natural finish.' },
  ];

  const productIds: string[] = [];
  let pi = 0;
  for (const p of products) {
    const sizes = p.sizes || [];
    const colors = p.colors || [];
    const hasVariants = sizes.length > 0 || colors.length > 0;
    const variants = hasVariants && sizes.length && colors.length
      ? sizes.flatMap((s) =>
          colors.slice(0, 3).map((c) => ({
            id: `${s}-${c}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            size: s, color: c, price: p.price,
            stock: Math.max(1, Math.floor(p.stock / (sizes.length * Math.min(colors.length, 3)))),
            sku: `${p.sku}-${s}-${c}`.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
          }))
        )
      : null;

    const created = await prisma.product.create({
      data: {
        name: p.name,
        nameBn: p.nameBn,
        slug: p.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        sku: p.sku,
        type: hasVariants ? 'variable' : 'simple',
        description: p.desc,
        shortDesc: p.short,
        price: p.price,
        comparePrice: p.compare ?? null,
        costPrice: p.cost ?? null,
        stock: p.stock,
        categoryId: categoryMap[p.cat] ?? null,
        brandId: brandMap[p.brand] ?? null,
        images: JSON.stringify(p.imgs),
        tags: p.tags,
        attributes: JSON.stringify([
          ...(p.fabric ? [{ name: 'Fabric', values: [p.fabric] }] : []),
          ...(p.occasion ? [{ name: 'Occasion', values: [p.occasion] }] : []),
          ...(p.fit ? [{ name: 'Fit', values: [p.fit] }] : []),
          ...(sizes.length ? [{ name: 'Size', values: sizes }] : []),
          ...(colors.length ? [{ name: 'Color', values: colors }] : []),
        ]),
        variants: variants ? JSON.stringify(variants) : null,
        featured: p.featured ?? false,
        bestseller: p.bestseller ?? false,
        newArrival: pi < 20,
        rating: p.rating ?? 4.5,
        reviewCount: p.reviews ?? 0,
        soldCount: p.sold ?? Math.floor(Math.random() * 200),
        viewCount: (p.sold ?? 100) * 7,
        fabric: p.fabric ?? null,
        occasion: p.occasion ?? null,
        fit: p.fit ?? null,
        careInstructions: 'Machine wash cold with similar colours. Do not bleach. Iron on medium heat.',
        metaTitle: `${p.name} — Buy Online in Bangladesh | BD Market`,
        metaDesc: p.short.slice(0, 155),
        metaKeywords: p.tags,
        ogImage: p.imgs[0],
      },
    });
    productIds.push(created.id);
    pi++;
  }
  console.log(`  ✓ ${products.length} products with variants`);

  // ─────────── Customers ───────────
  const customerDefs = [
    { name: 'Rahim Ahmed', email: 'rahim@example.com', phone: '+8801711000001', district: 'Dhaka', division: 'Dhaka', tags: 'vip,regular' },
    { name: 'Fatema Begum', email: 'fatema@example.com', phone: '+8801711000002', district: 'Chattogram', division: 'Chattogram', tags: 'regular' },
    { name: 'Karim Hossain', email: 'karim@example.com', phone: '+8801711000003', district: 'Dhaka', division: 'Dhaka', tags: 'new' },
    { name: 'Nusrat Jahan', email: 'nusrat@example.com', phone: '+8801711000004', district: 'Sylhet', division: 'Sylhet', tags: 'vip' },
    { name: 'Tanvir Islam', email: 'tanvir@example.com', phone: '+8801711000005', district: 'Khulna', division: 'Khulna', tags: 'regular' },
    { name: 'Sadia Rahman', email: 'sadia@example.com', phone: '+8801711000006', district: 'Rajshahi', division: 'Rajshahi', tags: 'new' },
    { name: 'Imran Khan', email: 'imran@example.com', phone: '+8801711000007', district: 'Dhaka', division: 'Dhaka', tags: 'regular' },
    { name: 'Ayesha Siddika', email: 'ayesha@example.com', phone: '+8801711000008', district: 'Gazipur', division: 'Dhaka', tags: 'vip,regular' },
  ];
  const custIds: string[] = [];
  for (const c of customerDefs) {
    const u = await prisma.user.create({
      data: { email: c.email, passwordHash: custPw, name: c.name, phone: c.phone, role: 'CUSTOMER' },
    });
    const cu = await prisma.customer.create({
      data: {
        userId: u.id, email: c.email, name: c.name, phone: c.phone,
        district: c.district, tags: c.tags, acceptsMarketing: true,
        addresses: {
          create: {
            label: 'Home', fullName: c.name, phone: c.phone, division: c.division,
            district: c.district, area: 'Sadar', street: 'House 10, Road 3', postcode: '1000', isDefault: true,
          },
        },
      },
    });
    custIds.push(cu.id);
  }
  console.log(`  ✓ ${customerDefs.length} customers`);

  // ─────────── Coupons ───────────
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', description: '10% off your first order', type: 'percent', value: 10, minOrder: 1000, maxDiscount: 500, usageLimit: 1000, usedCount: 143 },
      { code: 'EIDSALE25', description: 'Eid Special — 25% off', type: 'percent', value: 25, minOrder: 3000, maxDiscount: 2000, usageLimit: 500, usedCount: 89 },
      { code: 'FLAT300', description: 'Flat ৳300 off orders over ৳2500', type: 'fixed', value: 300, minOrder: 2500, usageLimit: 300, usedCount: 57 },
      { code: 'FREESHIP', description: 'Free shipping on any order', type: 'freeship', value: 0, minOrder: 500, usageLimit: 2000, usedCount: 412 },
      { code: 'BOISHakh15', description: 'Pohela Boishakh 15% off', type: 'percent', value: 15, minOrder: 2000, maxDiscount: 1200, usageLimit: 800, usedCount: 31 },
      { code: 'NEWUSER500', description: '৳500 off for new customers', type: 'fixed', value: 500, minOrder: 3000, usageLimit: 500, usedCount: 76 },
    ],
  });

  // ─────────── Shipping Zones ───────────
  await prisma.shippingZone.createMany({
    data: [
      { name: 'Inside Dhaka City', districts: 'Dhaka', method: 'flat', rate: 60, freeOver: 2000, minDays: 1, maxDays: 2, codEnabled: true, position: 0 },
      { name: 'Dhaka Suburbs (Gazipur, Narayanganj, Savar)', districts: 'Gazipur,Narayanganj,Manikganj,Munshiganj,Narsingdi', method: 'flat', rate: 100, freeOver: 2500, minDays: 2, maxDays: 3, position: 1 },
      { name: 'Chattogram Division', districts: 'Chattogram,Cox\'s Bazar,Cumilla,Feni,Noakhali,Lakshmipur,Chandpur,Brahmanbaria', method: 'flat', rate: 130, freeOver: 3000, minDays: 3, maxDays: 5, position: 2 },
      { name: 'Sylhet Division', districts: 'Sylhet,Moulvibazar, Habiganj,Sunamganj', method: 'flat', rate: 140, freeOver: 3000, minDays: 3, maxDays: 5, position: 3 },
      { name: 'Khulna & Barishal Division', districts: 'Khulna,Jashore,Kushtia,Satkhira,Barishal,Patuakhali,Bhola,Pirojpur', method: 'flat', rate: 150, freeOver: 3500, minDays: 3, maxDays: 6, position: 4 },
      { name: 'Rajshahi, Rangpur & Mymensingh', districts: 'Rajshahi,Bogura,Pabna,Rangpur,Dinajpur,Mymensingh,Jamalpur,Netrokona', method: 'flat', rate: 150, freeOver: 3500, minDays: 4, maxDays: 7, position: 5 },
      { name: 'Free Shipping (Orders ৳5000+)', districts: 'ALL', method: 'freeship_over', rate: 0, freeOver: 5000, minDays: 2, maxDays: 7, position: 6 },
    ],
  });

  // ─────────── Payment Methods ───────────
  await prisma.paymentMethod.createMany({
    data: [
      { code: 'cod', name: 'Cash on Delivery', nameBn: 'ক্যাশ অন ডেলিভারি', description: 'Pay in cash when your order arrives at your doorstep.', instructions: 'Please keep the exact amount ready. Our delivery agent will collect payment at delivery.', icon: '💵', isEnabled: true, isSandbox: false, fee: 0, position: 0 },
      { code: 'bkash', name: 'bKash', nameBn: 'বিকাশ', description: 'Pay instantly with bKash mobile wallet.', instructions: 'Send money to 01700-000000 (Merchant). Use your order number as reference. Your order will be confirmed after payment verification.', icon: '📱', isEnabled: true, isSandbox: true, fee: 0, feeType: 'percent', position: 1, config: JSON.stringify({ merchant: '01700000000', type: 'merchant' }) },
      { code: 'nagad', name: 'Nagad', nameBn: 'নগদ', description: 'Pay with Nagad mobile wallet — fast and secure.', instructions: 'Send money to 01700-000000 (Merchant). Include your order number in the reference field.', icon: '📲', isEnabled: true, isSandbox: true, fee: 0, position: 2, config: JSON.stringify({ merchant: '01700000000' }) },
      { code: 'rocket', name: 'Rocket', nameBn: 'রকেট', description: 'DBBL Rocket mobile banking.', instructions: 'Send money to 017000000001-2. Mention your order number as reference.', icon: '🚀', isEnabled: true, isSandbox: true, fee: 0, position: 3 },
      { code: 'sslcommerz', name: 'Card / Net Banking (SSLCommerz)', nameBn: 'কার্ড / নেট ব্যাংকিং', description: 'Visa, Mastercard, AMEX and internet banking via SSLCommerz.', instructions: 'You will be redirected to the SSLCommerz secure payment gateway.', icon: '💳', isEnabled: true, isSandbox: true, fee: 0, feeType: 'percent', position: 4 },
      { code: 'bank', name: 'Bank Transfer', nameBn: 'ব্যাংক ট্রান্সফার', description: 'Direct bank transfer to our account.', instructions: 'Transfer to: BD Market Ltd, A/C 1234567890, Dutch-Bangla Bank, Dhanmondi Branch. Send the deposit slip to support@bdmarket.com.bd.', icon: '🏦', isEnabled: false, isSandbox: false, fee: 0, position: 5 },
    ],
  });

  await prisma.taxRate.createMany({
    data: [
      { name: 'Standard VAT (Bangladesh)', country: 'BD', rate: 15, inclusive: true },
      { name: 'Reduced Rate (Essential Goods)', country: 'BD', rate: 7.5, inclusive: true },
      { name: 'Zero Rated', country: 'BD', rate: 0, inclusive: true },
    ],
  });

  // ─────────── Pages (CMS) ───────────
  await prisma.page.createMany({
    data: [
      { title: 'About Us', titleBn: 'আমাদের সম্পর্কে', slug: 'about', showInMenu: true, menuOrder: 1, content: '<h2>Who We Are</h2><p>BD Market is a Bangladeshi fashion and lifestyle store built for the modern shopper. We bring together authentic local craftsmanship — Jamdani sarees from Narayanganj, panjabis from Dhaka, jute goods from Faridpur — and make them available to every district of Bangladesh with cash on delivery.</p><h2>Our Mission</h2><p>To make authentic Bangladeshi fashion accessible, affordable and reliable — while supporting the artisans and weavers who keep our heritage alive.</p><h2>Why Shop With Us</h2><ul><li><strong>Authentic products</strong> — sourced directly from Bangladeshi manufacturers and artisans</li><li><strong>Cash on Delivery</strong> — available in every district, no advance payment needed</li><li><strong>Nationwide delivery</strong> — 64 districts covered within 1–7 business days</li><li><strong>Easy returns</strong> — 7-day return policy on unused items</li><li><strong>Secure payment</strong> — bKash, Nagad, Rocket and card payments via SSLCommerz</li></ul>', metaTitle: 'About BD Market — Authentic Bangladeshi Fashion Store', metaDesc: 'Learn about BD Market, a Bangladeshi fashion and lifestyle store committed to authentic local craftsmanship and nationwide cash on delivery.' },
      { title: 'Contact Us', titleBn: 'যোগাযোগ', slug: 'contact', showInMenu: true, menuOrder: 2, content: '<h2>Get in Touch</h2><p>We are here to help you 7 days a week.</p><h3>Customer Support</h3><p><strong>Hotline:</strong> 01700-000000 (9 AM – 9 PM)<br><strong>WhatsApp:</strong> +880 1700-000000<br><strong>Email:</strong> support@bdmarket.com.bd</p><h3>Head Office</h3><p>House 12, Road 5, Dhanmondi<br>Dhaka 1205, Bangladesh</p><h3>Order Tracking</h3><p>You can track your order anytime from your <a href="/account/orders">account page</a> or by entering your order number on our tracking page.</p>', metaTitle: 'Contact BD Market — Customer Support & Hotline', metaDesc: 'Contact BD Market customer support. Call our hotline, WhatsApp us or email us for order help, returns and product queries.' },
      { title: 'Privacy Policy', titleBn: 'প্রাইভেসি পলিসি', slug: 'privacy-policy', content: '<h2>Privacy Policy</h2><p>Last updated: September 2026</p><p>BD Market respects your privacy. This policy explains what information we collect, how we use it, and your rights.</p><h3>Information We Collect</h3><ul><li>Name, phone number and delivery address for order fulfilment</li><li>Email address for order confirmation and account access</li><li>Payment reference information (we never store card numbers or wallet PINs)</li><li>Browsing data to improve our store experience</li></ul><h3>How We Use Your Information</h3><p>Your information is used solely to process orders, arrange delivery, provide customer support and improve our services. We never sell your personal data to third parties.</p><h3>Data Sharing</h3><p>We share delivery details with our courier partners only as needed to deliver your order.</p><h3>Your Rights</h3><p>You may request access to, correction of, or deletion of your personal data by emailing support@bdmarket.com.bd.</p>', metaTitle: 'Privacy Policy | BD Market', metaDesc: 'Read how BD Market collects, uses and protects your personal information.' },
      { title: 'Terms & Conditions', slug: 'terms', content: '<h2>Terms & Conditions</h2><p>By using bdmarket.com.bd you agree to the following terms.</p><h3>Orders</h3><p>All orders are subject to product availability and confirmation. We reserve the right to cancel any order.</p><h3>Pricing</h3><p>All prices are in Bangladeshi Taka (BDT) and inclusive of applicable VAT unless stated otherwise. Prices may change without notice.</p><h3>Delivery</h3><p>Standard delivery is 1–7 business days depending on district. Delivery times are estimates and not guaranteed.</p><h3>Returns</h3><p>Unused items in original packaging may be returned within 7 days of delivery. Return shipping costs are the customer\'s responsibility unless the item is defective.</p><h3>Payment</h3><p>Cash on delivery, bKash, Nagad, Rocket and card payments are accepted. Orders paid via mobile wallet are confirmed after verification.</p>', metaTitle: 'Terms & Conditions | BD Market', metaDesc: 'Terms and conditions for shopping with BD Market.' },
      { title: 'Return & Refund Policy', slug: 'returns', showInMenu: true, menuOrder: 3, content: '<h2>Return & Refund Policy</h2><h3>Return Window</h3><p>You may request a return within <strong>7 days</strong> of receiving your order.</p><h3>Conditions</h3><ul><li>Item must be unused, unwashed and in original packaging with tags attached</li><li>Original invoice must be presented</li><li>Intimate apparel, cosmetics and personalised items are non-returnable</li></ul><h3>How to Return</h3><ol><li>Call our hotline 01700-000000 or email support@bdmarket.com.bd</li><li>Provide your order number and reason for return</li><li>We will arrange a pickup or provide a return address</li></ol><h3>Refunds</h3><p>Refunds are processed within 5–7 business days after we receive and inspect the returned item. Refunds are issued via the original payment method, or as store credit for cash on delivery orders.</p>', metaTitle: 'Return & Refund Policy | BD Market', metaDesc: 'BD Market 7-day return and refund policy explained.' },
      { title: 'Shipping & Delivery', slug: 'shipping', content: '<h2>Shipping & Delivery</h2><h3>Delivery Charges</h3><table><thead><tr><th>Area</th><th>Charge</th><th>Time</th></tr></thead><tbody><tr><td>Inside Dhaka City</td><td>৳60</td><td>1–2 days</td></tr><tr><td>Dhaka Suburbs</td><td>৳100</td><td>2–3 days</td></tr><tr><td>Chattogram Division</td><td>৳130</td><td>3–5 days</td></tr><tr><td>Other Divisions</td><td>৳150</td><td>4–7 days</td></tr></tbody></table><h3>Free Shipping</h3><p>Free delivery on all orders above <strong>৳2,000</strong> inside Dhaka and <strong>৳5,000</strong> nationwide.</p><h3>Cash on Delivery</h3><p>COD is available in all 64 districts. Please keep the exact amount ready for the delivery agent.</p>', metaTitle: 'Shipping & Delivery Information | BD Market', metaDesc: 'Delivery charges, times and free shipping thresholds for BD Market across Bangladesh.' },
      { title: 'Track Your Order', slug: 'track-order', content: '<h2>Track Your Order</h2><p>Enter your order number below to check the current status of your delivery.</p>', metaTitle: 'Track Your Order | BD Market', metaDesc: 'Track your BD Market order status online.' },
      { title: 'FAQ', slug: 'faq', content: '<h2>Frequently Asked Questions</h2><h3>How do I place an order?</h3><p>Browse our shop, add items to your cart and proceed to checkout. You can order as a guest or create an account.</p><h3>What payment methods do you accept?</h3><p>Cash on Delivery, bKash, Nagad, Rocket and card payments via SSLCommerz.</p><h3>How long does delivery take?</h3><p>1–2 days inside Dhaka, 3–7 days for other districts.</p><h3>Can I return an item?</h3><p>Yes — unused items can be returned within 7 days. See our <a href="/pages/returns">Return Policy</a>.</p><h3>Do you deliver outside Bangladesh?</h3><p>Currently we deliver only within Bangladesh.</p><h3>Is my payment secure?</h3><p>Yes. Wallet payments are verified via gateway APIs and we never store card or PIN data.</p>', metaTitle: 'FAQ — Frequently Asked Questions | BD Market', metaDesc: 'Answers to common questions about ordering, payment, delivery and returns at BD Market.' },
    ],
  });

  // ─────────── Blog Posts ───────────
  await prisma.post.createMany({
    data: [
      { title: 'Jamdani: The Heritage Weave of Bangladesh', slug: 'jamdani-heritage-weave-bangladesh', category: 'Culture', tags: 'jamdani,heritage,handloom,culture', featured: true, readMinutes: 7, viewCount: 3421, excerpt: 'Jamdani is more than fabric — it is a 2,000-year-old conversation between weaver and thread. Here is why it matters.', coverImage: IMAGES.saree1, content: '<p>Jamdani weaving is one of the most intricate textile arts in the world, and it belongs to Bangladesh. Recognised by UNESCO as Intangible Cultural Heritage, it is practised today by thousands of weavers along the banks of the Shitalakshya river in Narayanganj and Dhaka.</p><h2>What Makes Jamdani Different</h2><p>Unlike printed or embroidered fabric, Jamdani motifs are woven <em>into</em> the cloth. The weaver uses a supplementary weft technique, adding each motif by hand as the fabric grows. A single saree can take 15 to 45 days.</p><h2>The Motifs</h2><p>Traditional motifs include <em>panna hajar</em> (thousand emeralds), <em>tercha</em> (diagonal waves) and <em>jor buti</em> (paired flowers). Each carries regional meaning passed down through generations.</p><h2>How to Care for Jamdani</h2><ul><li>Dry clean only for the first wash</li><li>Store folded in a cotton or muslin bag</li><li>Rotate folds every few months to prevent creasing</li><li>Keep away from direct sunlight and naphthalene balls</li></ul><p>When you buy a Jamdani saree, you are not just buying clothing — you are supporting a weaver family and keeping an ancient craft alive.</p>' },
      { title: 'Eid Fashion Guide 2026: What to Wear This Season', slug: 'eid-fashion-guide-2026', category: 'Fashion', tags: 'eid,fashion,guide,panjabi', featured: true, readMinutes: 6, viewCount: 5218, excerpt: 'From karchupi panjabi to muslin saree — our complete Eid styling guide for 2026 with budget picks.', coverImage: IMAGES.panjabi1, content: '<p>Eid is the biggest fashion moment of the Bangladeshi calendar. Here is how to look your best in 2026 without overspending.</p><h2>For Men</h2><p>The panjabi remains king. This year we are seeing a shift toward <strong>muted tones</strong> — cream, sage, dusty rose — paired with white pyjama and a simple leather <em>nagra</em>. If you want to stand out, a karchupi panjabi with tonal embroidery delivers impact without being loud.</p><h2>For Women</h2><p>Muslin and Jamdani sarees are always the safe luxury choice. For a modern twist, pair a plain silk saree with a heavily embroidered blouse. Three-piece sets in georgette remain the most comfortable festive option for long days.</p><h2>Budget Picks</h2><ul><li>Under ৳2000 — printed cotton panjabi, rayon kurti</li><li>৳2000–5000 — embroidered cotton panjabi, cotton kurti-palazzo set</li><li>৳5000+ — katan silk saree, karchupi panjabi</li></ul><h2>Kids</h2><p>Comfort matters more than anything. Choose soft cotton panjabi sets with elasticated waists so they can run around freely.</p>' },
      { title: 'How to Choose the Right Saree for Your Body Type', slug: 'choose-right-saree-body-type', category: 'Style Guide', tags: 'saree,style,guide,size', readMinutes: 5, viewCount: 2874, excerpt: 'Petite, tall, curvy or straight — there is a saree drape and fabric that flatters every silhouette.', coverImage: IMAGES.saree3, content: '<p>A saree flatters everyone — the trick is choosing the right fabric, border weight and drape.</p><h2>Petite Frames</h2><p>Choose lighter fabrics like chiffon, georgette or soft cotton. Avoid heavy borders that overwhelm your frame. A narrower border and a slightly higher drape add height.</p><h2>Tall Frames</h2><p>You can carry bold borders, broad pallus and heavy weaves like Katan silk. Large motifs look proportionate on you.</p><h2>Curvy Silhouettes</h2><p>Crepe, georgette and South Cotton drape smoothly without adding bulk. Avoid stiff starched fabrics. A well-fitted blouse is more important than the saree itself.</p><h2>Straight Figures</h2><p>Textured fabric — Jamdani, tissue, organza — creates depth. Add a pleated pallu and a belt to define the waist.</p>' },
      { title: 'Cash on Delivery in Bangladesh: How It Works', slug: 'cash-on-delivery-bangladesh-guide', category: 'Guides', tags: 'cod,delivery,guide,payment', readMinutes: 4, viewCount: 1936, excerpt: 'COD makes online shopping trust-free. Here is exactly what to expect when your parcel arrives.', coverImage: IMAGES.bag1, content: '<p>Cash on Delivery is the most trusted payment method in Bangladesh — and for good reason. You pay only when the product is in your hands.</p><h2>The COD Process</h2><ol><li>Place your order without any advance payment</li><li>We confirm by phone or SMS within a few hours</li><li>Your parcel is dispatched through our courier partner</li><li>The delivery agent calls before arriving</li><li>Inspect the parcel, then pay in cash</li></ol><h2>Tips</h2><ul><li>Keep the exact amount ready — agents rarely carry change</li><li>You may open and inspect the packet before paying (for most items)</li><li>Refusing delivery repeatedly may lead to COD being disabled on your account</li></ul><h2>COD Charges</h2><p>COD is free on all orders — no extra handling fee.</p>' },
      { title: 'Panjabi Care: Make Your Festive Wear Last Years', slug: 'panjabi-care-guide', category: 'Care', tags: 'panjabi,care,washing,maintenance', readMinutes: 5, viewCount: 1452, excerpt: 'Embroidery, silk blends and starch — how to wash and store panjabi so it looks new every Eid.', coverImage: IMAGES.panjabi2, content: '<p>A good panjabi is an investment. With the right care it will serve you for a decade of Eids.</p><h2>Cotton Panjabi</h2><p>Machine wash cold on a gentle cycle, inside out. Do not wring. Dry in shade to prevent fading. Iron on medium while slightly damp.</p><h2>Silk & Silk Blend</h2><p>Dry clean only. If hand washing, use a mild baby shampoo in cold water, never rub the fabric and never wring. Dry flat in shade.</p><h2>Embroidered / Karchupi</h2><p>Dry clean only. Never iron directly on embroidery — use a pressing cloth or iron from the reverse side. Store folded with muslin between layers.</p><h2>Storage</h2><ul><li>Use padded hangers for silk, fold cotton</li><li>Avoid plastic bags — they trap moisture</li><li>Add neem leaves instead of naphthalene for natural protection</li></ul>' },
      { title: 'Top 10 Bangladeshi Fashion Brands You Should Know', slug: 'top-bangladeshi-fashion-brands', category: 'Brands', tags: 'brands,bangladesh,fashion,local', readMinutes: 8, viewCount: 4103, excerpt: 'From heritage houses to new-gen labels — the Bangladeshi brands shaping what we wear.', coverImage: IMAGES.kurti1, content: '<p>Bangladeshi fashion has never been more exciting. These are the labels defining the moment.</p><h2>Heritage Houses</h2><p><strong>Aarong</strong> — the benchmark for Bangladeshi craft retail, supporting over 65,000 artisans. <strong>Kay Kraft</strong> — known for bold prints and fusion silhouettes. <strong>Rang Bangladesh</strong> — the home of authentic Jamdani.</p><h2>Contemporary Labels</h2><p><strong>Yellow</strong> — clean, minimal, everyday wear. <strong>Le Reve</strong> — occasion-wear specialists. <strong>Dorjibari</strong> — the go-to for festive panjabi. <strong>Sailor</strong> — reliable basics at fair prices.</p><h2>New Generation</h2><p><strong>Infinity</strong> — youth-focused casualwear. <strong>Ecstasy</strong> — party and bridal. <strong>Anjan\'s</strong> — menswear essentials.</p><p>Every purchase from a local brand keeps money, skills and jobs inside Bangladesh.</p>' },
    ],
  });

  // ─────────── Menus ───────────
  await prisma.menu.createMany({
    data: [
      {
        name: 'Main Navigation', location: 'header',
        items: JSON.stringify([
          { label: 'Home', labelBn: 'হোম', href: '/' },
          {
            label: 'Women', labelBn: 'মহিলা', href: '/category/women',
            children: [
              { label: 'Saree', labelBn: 'শাড়ি', href: '/category/saree' },
              { label: 'Kurti', labelBn: 'কুর্তি', href: '/category/kurti' },
              { label: 'Three Piece', labelBn: 'থ্রি-পিস', href: '/category/three-piece' },
              { label: 'Salwar Kameez', labelBn: 'সালোয়ার কামিজ', href: '/category/salwar-kameez' },
              { label: 'Lehenga', labelBn: 'লেহেঙ্গা', href: '/category/lehenga' },
              { label: 'Hijab & Abaya', labelBn: 'হিজাব ও আবায়া', href: '/category/hijab-abaya' },
            ],
          },
          {
            label: 'Men', labelBn: 'পুরুষ', href: '/category/men',
            children: [
              { label: 'Panjabi', labelBn: 'পাঞ্জাবি', href: '/category/panjabi' },
              { label: 'Shirt', labelBn: 'শার্ট', href: '/category/shirt' },
              { label: 'T-Shirt & Polo', href: '/category/t-shirt-polo' },
              { label: 'Pant & Trouser', href: '/category/pant-trouser' },
            ],
          },
          { label: 'Kids', labelBn: 'শিশু', href: '/category/kids' },
          { label: 'Accessories', labelBn: 'এক্সেসরিজ', href: '/category/accessories' },
          { label: 'Jewellery', labelBn: 'গহনা', href: '/category/jewellery' },
          { label: 'Blog', labelBn: 'ব্লগ', href: '/blog' },
          { label: 'Contact', labelBn: 'যোগাযোগ', href: '/pages/contact' },
        ]),
      },
      {
        name: 'Customer Service', location: 'footer-1',
        items: JSON.stringify([
          { label: 'About Us', href: '/pages/about' },
          { label: 'Contact Us', href: '/pages/contact' },
          { label: 'Track Order', href: '/track' },
          { label: 'Shipping Info', href: '/pages/shipping' },
          { label: 'Returns & Refunds', href: '/pages/returns' },
          { label: 'FAQ', href: '/pages/faq' },
        ]),
      },
      {
        name: 'Shop Links', location: 'footer-2',
        items: JSON.stringify([
          { label: 'All Products', href: '/shop' },
          { label: 'New Arrivals', href: '/shop?sort=newest' },
          { label: 'Best Sellers', href: '/shop?sort=popular' },
          { label: 'Sale Items', href: '/shop?sale=1' },
          { label: 'Blog', href: '/blog' },
        ]),
      },
      {
        name: 'Legal', location: 'footer-3',
        items: JSON.stringify([
          { label: 'Privacy Policy', href: '/pages/privacy-policy' },
          { label: 'Terms & Conditions', href: '/pages/terms' },
          { label: 'Refund Policy', href: '/pages/returns' },
        ]),
      },
    ],
  });

  // ─────────── Banners ───────────
  await prisma.banner.createMany({
    data: [
      { title: 'Eid Collection 2026', subtitle: 'Hand-embroidered panjabi, muslin Jamdani & festive three-piece — up to 30% off', image: IMAGES.panjabi1, ctaLabel: 'Shop Eid Collection', ctaHref: '/shop?sort=newest', position: 'hero', bgColor: '#006a4e', textColor: '#ffffff', position_order: 0 },
      { title: 'Heritage Jamdani', subtitle: 'Handwoven by Narayanganj master weavers — a piece of Bangladesh you can wear', image: IMAGES.saree1, ctaLabel: 'Explore Jamdani', ctaHref: '/category/saree', position: 'hero', bgColor: '#1f2533', textColor: '#ffffff', position_order: 1 },
      { title: 'Modest Fashion', subtitle: 'Premium georgette hijab & nida abaya — comfort with grace', image: IMAGES.hijab1, ctaLabel: 'Shop Modest Wear', ctaHref: '/category/hijab-abaya', position: 'hero', bgColor: '#7c2d12', textColor: '#ffffff', position_order: 2 },
      { title: 'Free Delivery over ৳2,000', subtitle: 'Inside Dhaka — 1 to 2 days', image: IMAGES.bag1, ctaLabel: 'Start Shopping', ctaHref: '/shop', position: 'promo-1', position_order: 0 },
      { title: 'Cash on Delivery', subtitle: 'All 64 districts of Bangladesh', image: IMAGES.shoes1, ctaLabel: 'Learn More', ctaHref: '/pages/shipping', position: 'promo-2', position_order: 0 },
    ],
  });

  // ─────────── Settings ───────────
  const settings: { group: string; key: string; value: string; type: string; label: string }[] = [
    // General
    { group: 'general', key: 'site_name', value: 'BD Market', type: 'text', label: 'Site Name' },
    { group: 'general', key: 'site_name_bn', value: 'বিডি মার্কেট', type: 'text', label: 'Site Name (Bangla)' },
    { group: 'general', key: 'site_tagline', value: "Bangladesh's Fashion & Lifestyle Store", type: 'text', label: 'Tagline' },
    { group: 'general', key: 'site_logo', value: '', type: 'image', label: 'Logo URL' },
    { group: 'general', key: 'site_favicon', value: '/favicon.svg', type: 'image', label: 'Favicon URL' },
    { group: 'general', key: 'site_url', value: 'http://localhost:3000', type: 'text', label: 'Site URL' },
    { group: 'general', key: 'store_email', value: 'support@bdmarket.com.bd', type: 'text', label: 'Support Email' },
    { group: 'general', key: 'store_phone', value: '01700-000000', type: 'text', label: 'Hotline' },
    { group: 'general', key: 'store_whatsapp', value: '+8801700000000', type: 'text', label: 'WhatsApp' },
    { group: 'general', key: 'store_address', value: 'House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh', type: 'textarea', label: 'Store Address' },
    { group: 'general', key: 'store_country', value: 'Bangladesh', type: 'text', label: 'Country' },
    { group: 'general', key: 'maintenance_mode', value: 'false', type: 'boolean', label: 'Maintenance Mode' },

    // Store
    { group: 'store', key: 'store_currency', value: 'BDT', type: 'select', label: 'Currency' },
    { group: 'store', key: 'store_currency_symbol', value: '৳', type: 'text', label: 'Currency Symbol' },
    { group: 'store', key: 'store_timezone', value: 'Asia/Dhaka', type: 'text', label: 'Timezone' },
    { group: 'store', key: 'store_language', value: 'en', type: 'select', label: 'Default Language' },
    { group: 'store', key: 'enable_bangla', value: 'true', type: 'boolean', label: 'Enable Bangla Content' },
    { group: 'store', key: 'products_per_page', value: '12', type: 'number', label: 'Products Per Page' },
    { group: 'store', key: 'low_stock_threshold', value: '5', type: 'number', label: 'Low Stock Threshold' },
    { group: 'store', key: 'tax_rate', value: '0', type: 'number', label: 'Default VAT Rate (%)' },
    { group: 'store', key: 'tax_inclusive', value: 'true', type: 'boolean', label: 'Prices Include VAT' },

    // Checkout
    { group: 'checkout', key: 'checkout_guest', value: 'true', type: 'boolean', label: 'Allow Guest Checkout' },
    { group: 'checkout', key: 'checkout_terms_url', value: '/pages/terms', type: 'text', label: 'Terms Page URL' },
    { group: 'checkout', key: 'checkout_min_order', value: '0', type: 'number', label: 'Minimum Order Value' },
    { group: 'checkout', key: 'checkout_max_qty', value: '10', type: 'number', label: 'Max Quantity Per Item' },
    { group: 'checkout', key: 'checkout_require_phone', value: 'true', type: 'boolean', label: 'Require Phone Number' },
    { group: 'checkout', key: 'checkout_order_note', value: 'true', type: 'boolean', label: 'Enable Order Note' },

    // Shipping
    { group: 'shipping', key: 'shipping_enabled', value: 'true', type: 'boolean', label: 'Enable Shipping' },
    { group: 'shipping', key: 'shipping_default_rate', value: '100', type: 'number', label: 'Default Shipping Rate (৳)' },
    { group: 'shipping', key: 'shipping_free_over', value: '2000', type: 'number', label: 'Free Shipping Over (৳)' },
    { group: 'shipping', key: 'shipping_min_days', value: '1', type: 'number', label: 'Min Delivery Days' },
    { group: 'shipping', key: 'shipping_max_days', value: '7', type: 'number', label: 'Max Delivery Days' },
    { group: 'shipping', key: 'shipping_cod_enabled', value: 'true', type: 'boolean', label: 'Enable Cash on Delivery' },

    // Payment
    { group: 'payment', key: 'payment_cod_enabled', value: 'true', type: 'boolean', label: 'COD Enabled' },
    { group: 'payment', key: 'payment_bkash_enabled', value: 'true', type: 'boolean', label: 'bKash Enabled' },
    { group: 'payment', key: 'payment_nagad_enabled', value: 'true', type: 'boolean', label: 'Nagad Enabled' },
    { group: 'payment', key: 'payment_rocket_enabled', value: 'true', type: 'boolean', label: 'Rocket Enabled' },
    { group: 'payment', key: 'payment_sslcommerz_enabled', value: 'true', type: 'boolean', label: 'SSLCommerz Enabled' },
    { group: 'payment', key: 'payment_cod_fee', value: '0', type: 'number', label: 'COD Fee (৳)' },

    // SEO
    { group: 'seo', key: 'seo_default_title', value: 'BD Market — Bangladesh Fashion & Lifestyle Online Store', type: 'text', label: 'Default Meta Title' },
    { group: 'seo', key: 'seo_title_template', value: '%s | BD Market', type: 'text', label: 'Title Template' },
    { group: 'seo', key: 'seo_default_description', value: 'Shop authentic Bangladeshi fashion — panjabi, saree, kurti and lifestyle products. Cash on delivery nationwide, bKash & Nagad accepted.', type: 'textarea', label: 'Default Meta Description' },
    { group: 'seo', key: 'seo_keywords', value: 'bangladesh online shop, panjabi, saree, kurti, bd market, dhaka fashion, online shopping bangladesh', type: 'textarea', label: 'Default Keywords' },
    { group: 'seo', key: 'seo_og_image', value: '', type: 'image', label: 'Default OG Image' },
    { group: 'seo', key: 'seo_twitter_handle', value: '@bdmarket', type: 'text', label: 'Twitter Handle' },
    { group: 'seo', key: 'seo_verification', value: '', type: 'text', label: 'Google Verification Code' },
    { group: 'seo', key: 'seo_sitemap_enabled', value: 'true', type: 'boolean', label: 'Enable XML Sitemap' },
    { group: 'seo', key: 'seo_robots_txt', value: 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: http://localhost:3000/sitemap.xml', type: 'textarea', label: 'robots.txt Content' },
    { group: 'seo', key: 'seo_schema_org', value: 'true', type: 'boolean', label: 'Enable Schema.org Structured Data' },
    { group: 'seo', key: 'seo_breadcrumbs', value: 'true', type: 'boolean', label: 'Enable Breadcrumbs' },

    // Analytics
    { group: 'analytics', key: 'analytics_ga_id', value: '', type: 'text', label: 'Google Analytics ID' },
    { group: 'analytics', key: 'analytics_gtm_id', value: '', type: 'text', label: 'Google Tag Manager ID' },
    { group: 'analytics', key: 'analytics_fb_pixel', value: '', type: 'text', label: 'Facebook Pixel ID' },
    { group: 'analytics', key: 'analytics_enabled', value: 'false', type: 'boolean', label: 'Enable Analytics' },

    // Appearance
    { group: 'appearance', key: 'theme_primary', value: '#006a4e', type: 'text', label: 'Primary Color' },
    { group: 'appearance', key: 'theme_accent', value: '#f42a41', type: 'text', label: 'Accent Color' },
    { group: 'appearance', key: 'show_announcement', value: 'true', type: 'boolean', label: 'Show Announcement Bar' },
    { group: 'appearance', key: 'announcement_text', value: 'ফ্রি ডেলিভারি ৳২০০০+ অর্ডারে • সারা বাংলাদেশে ক্যাশ অন ডেলিভারি • হটলাইন ০১৭০০-০০০০০০', type: 'text', label: 'Announcement Text' },
    { group: 'appearance', key: 'show_whatsapp_float', value: 'true', type: 'boolean', label: 'Show WhatsApp Float Button' },

    // Reviews
    { group: 'reviews', key: 'reviews_enabled', value: 'true', type: 'boolean', label: 'Enable Product Reviews' },
    { group: 'reviews', key: 'reviews_auto_approve', value: 'false', type: 'boolean', label: 'Auto-approve Reviews' },
    { group: 'reviews', key: 'reviews_guest', value: 'true', type: 'boolean', label: 'Allow Guest Reviews' },

    // Email
    { group: 'email', key: 'email_from_name', value: 'BD Market', type: 'text', label: 'From Name' },
    { group: 'email', key: 'email_from_address', value: 'no-reply@bdmarket.com.bd', type: 'text', label: 'From Email' },
    { group: 'email', key: 'email_order_confirm', value: 'true', type: 'boolean', label: 'Send Order Confirmation' },
    { group: 'email', key: 'email_order_shipped', value: 'true', type: 'boolean', label: 'Send Shipping Notification' },
    { group: 'email', key: 'email_footer_text', value: 'BD Market — House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh', type: 'textarea', label: 'Email Footer' },

    // SMS
    { group: 'sms', key: 'sms_enabled', value: 'false', type: 'boolean', label: 'Enable SMS' },
    { group: 'sms', key: 'sms_sender_id', value: 'BDMARKET', type: 'text', label: 'SMS Sender ID' },
    { group: 'sms', key: 'sms_order_confirm', value: 'true', type: 'boolean', label: 'SMS on Order Confirm' },
    { group: 'sms', key: 'sms_order_shipped', value: 'true', type: 'boolean', label: 'SMS on Shipment' },

    // Social
    { group: 'social', key: 'social_facebook', value: 'https://facebook.com/bdmarket', type: 'text', label: 'Facebook' },
    { group: 'social', key: 'social_instagram', value: 'https://instagram.com/bdmarket', type: 'text', label: 'Instagram' },
    { group: 'social', key: 'social_youtube', value: 'https://youtube.com/@bdmarket', type: 'text', label: 'YouTube' },
    { group: 'social', key: 'social_tiktok', value: '', type: 'text', label: 'TikTok' },
    { group: 'social', key: 'social_twitter', value: '', type: 'text', label: 'X (Twitter)' },
    { group: 'social', key: 'social_linkedin', value: '', type: 'text', label: 'LinkedIn' },

    // Advanced
    { group: 'advanced', key: 'advanced_api_key', value: 'bdm-api-dev-key', type: 'text', label: 'REST API Key' },
    { group: 'advanced', key: 'advanced_cache', value: 'true', type: 'boolean', label: 'Enable Page Cache' },
    { group: 'advanced', key: 'advanced_debug', value: 'false', type: 'boolean', label: 'Debug Mode' },

    // Accepted-payment brand logos for the footer 3x3 grid. Stored as one JSON
    // list so the admin can add/remove/reorder methods. An empty value means
    // "use the built-in defaults", which is what a fresh install should show.
    { group: 'payment_logos', key: 'payment_logos', value: '', type: 'json', label: 'Accepted Payment Logos' },
  ];
  await prisma.setting.createMany({ data: settings });
  console.log(`  ✓ ${settings.length} settings across 14 groups`);

  // ─────────── Reviews ───────────
  const reviewTexts = [
    { rating: 5, title: 'Exactly as described', body: 'The fabric quality is excellent and the stitching is neat. Delivered in Dhaka within 2 days. Highly recommended!' },
    { rating: 4, title: 'Good quality, slightly expensive', body: 'Very good quality product. Colour matched the photo. Only complaint is the price could be a bit lower.' },
    { rating: 5, title: 'Best purchase this Eid', body: 'Wore it on Eid and got so many compliments. The embroidery work is beautiful and the fit is perfect.' },
    { rating: 3, title: 'Average', body: 'Product is okay but the colour is slightly different from the photo. Delivery was on time though.' },
    { rating: 5, title: 'Worth every taka', body: 'Authentic Bangladeshi craftsmanship. You can feel the quality the moment you touch it. Will buy again.' },
    { rating: 4, title: 'Fast delivery', body: 'Ordered on Friday, received on Sunday in Chattogram. Product quality is good for the price.' },
    { rating: 5, title: 'Great customer service', body: 'Had a sizing question and their team responded on WhatsApp within minutes. Very helpful. Product fits perfectly.' },
    { rating: 4, title: 'Nice product', body: 'Happy with the purchase overall. Packaging was neat and the product was exactly as shown.' },
  ];
  const reviewers = ['Rahim A.', 'Fatema B.', 'Karim H.', 'Nusrat J.', 'Tanvir I.', 'Sadia R.', 'Imran K.', 'Ayesha S.'];
  let reviewCount = 0;
  for (let i = 0; i < productIds.length; i++) {
    const numReviews = 2 + (i % 3);
    for (let j = 0; j < numReviews; j++) {
      const r = reviewTexts[(i + j) % reviewTexts.length];
      await prisma.review.create({
        data: {
          productId: productIds[i],
          customerId: custIds[(i + j) % custIds.length],
          authorName: reviewers[(i + j) % reviewers.length],
          authorEmail: `reviewer${i}${j}@example.com`,
          rating: r.rating,
          title: r.title,
          body: r.body,
          status: (i + j) % 7 === 0 ? 'pending' : 'approved',
          verified: true,
          helpful: (i * 3 + j * 7) % 24,
          createdAt: new Date(Date.now() - (i * 3 + j) * 86400000 * 2),
        },
      });
      reviewCount++;
    }
  }
  console.log(`  ✓ ${reviewCount} reviews`);

  // ─────────── Orders ───────────
  const statuses = ['PENDING','PROCESSING','CONFIRMED','PACKED','SHIPPED','DELIVERED','DELIVERED','DELIVERED','CANCELLED','DELIVERED'] as const;
  const payMethods = ['cod','bkash','nagad','cod','cod','sslcommerz','cod','bkash','cod','rocket'];
  let orderCount = 0;

  for (let i = 0; i < 42; i++) {
    const cust = custIds[i % custIds.length];
    const customer = await prisma.customer.findUnique({ where: { id: cust } });
    if (!customer) continue;

    const status = statuses[i % statuses.length];
    const daysBack = Math.floor(Math.random() * 58) + 1;
    const created = new Date(Date.now() - daysBack * 86400000 - Math.random() * 86400000);
    const numItems = 1 + (i % 3);

    const items = [];
    let subtotal = 0;
    for (let k = 0; k < numItems; k++) {
      const pid = productIds[(i * 3 + k * 7) % productIds.length];
      const prod = await prisma.product.findUnique({ where: { id: pid } });
      if (!prod) continue;
      const qty = 1 + ((i + k) % 2);
      const lineTotal = prod.price * qty;
      subtotal += lineTotal;
      items.push({
        productId: prod.id, productName: prod.name, variant: 'M / Navy',
        sku: prod.sku, image: JSON.parse(prod.images)[0], price: prod.price, qty, total: lineTotal,
      });
    }
    if (!items.length) continue;

    const shipping = subtotal >= 2000 ? 0 : 100;
    const discount = i % 5 === 0 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount + shipping;
    const paymentMethod = payMethods[i % payMethods.length];
    const paymentStatus = status === 'DELIVERED' ? 'paid' : status === 'CANCELLED' ? 'unpaid' : paymentMethod === 'cod' ? 'unpaid' : 'paid';
    const district = customer.district || 'Dhaka';

    const order = await prisma.order.create({
      data: {
        orderNumber: `BD2609${String(1000 + i)}`,
        customerId: cust,
        email: customer.email,
        phone: customer.phone || '+8801700000000',
        customerName: customer.name,
        status,
        paymentStatus,
        paymentMethod,
        paymentRef: paymentMethod !== 'cod' ? `TRX${Date.now()}${i}`.slice(0, 16) : null,
        subtotal,
        discount,
        shippingCost: shipping,
        total,
        couponCode: discount > 0 ? 'WELCOME10' : null,
        shippingMethod: shipping === 0 ? 'Free Delivery' : 'Standard Delivery',
        shippingZone: district === 'Dhaka' ? 'Inside Dhaka City' : 'Outside Dhaka',
        shipDivision: customer.district === 'Dhaka' ? 'Dhaka' : 'Chattogram',
        shipDistrict: district,
        shipArea: 'Sadar',
        shipStreet: 'House 10, Road 3',
        shipPostcode: '1000',
        customerNote: i % 4 === 0 ? 'Please call before delivery.' : null,
        trackingNumber: ['SHIPPED','DELIVERED'].includes(status) ? `BDM${Math.random().toString(36).slice(2, 10).toUpperCase()}` : null,
        courier: ['SHIPPED','DELIVERED'].includes(status) ? ['Pathao', 'Steadfast', 'RedX'][i % 3] : null,
        createdAt: created,
        confirmedAt: ['CONFIRMED','PACKED','SHIPPED','DELIVERED'].includes(status) ? new Date(created.getTime() + 3600000) : null,
        shippedAt: ['SHIPPED','DELIVERED'].includes(status) ? new Date(created.getTime() + 86400000) : null,
        deliveredAt: status === 'DELIVERED' ? new Date(created.getTime() + 86400000 * 3) : null,
        items: { create: items },
        timeline: {
          create: [
            { status: 'PENDING', note: 'Order placed successfully', by: 'System', createdAt: created },
            ...(['CONFIRMED','PACKED','SHIPPED','DELIVERED'].includes(status)
              ? [{ status: 'CONFIRMED', note: 'Order confirmed by phone', by: 'Store Manager', createdAt: new Date(created.getTime() + 3600000) }]
              : []),
            ...(['SHIPPED','DELIVERED'].includes(status)
              ? [{ status: 'SHIPPED', note: 'Handed over to courier', by: 'Store Manager', createdAt: new Date(created.getTime() + 86400000) }]
              : []),
            ...(status === 'DELIVERED'
              ? [{ status: 'DELIVERED', note: 'Delivered and payment collected', by: 'Courier', createdAt: new Date(created.getTime() + 86400000 * 3) }]
              : []),
            ...(status === 'CANCELLED'
              ? [{ status: 'CANCELLED', note: 'Cancelled at customer request', by: 'Store Manager', createdAt: new Date(created.getTime() + 7200000) }]
              : []),
          ],
        },
      },
    });
    orderCount++;

    // Update customer stats
    if (status === 'DELIVERED') {
      await prisma.customer.update({
        where: { id: cust },
        data: { totalSpent: { increment: total }, orderCount: { increment: 1 } },
      });
    }
  }
  console.log(`  ✓ ${orderCount} orders with timeline events`);

  // ─────────── Search & Page view analytics ───────────
  const searchTerms = ['panjabi', 'jamdani saree', 'kurti', 'hijab', 'eid collection', 'lehenga', 'sneakers', 'attar', 'three piece', 'nakshi kantha'];
  for (let i = 0; i < 120; i++) {
    await prisma.searchQuery.create({
      data: { query: searchTerms[i % searchTerms.length], results: 3 + (i % 12), createdAt: new Date(Date.now() - i * 3600000 * 4) },
    });
  }

  // ─────────── Media library ───────────
  const mediaFiles = Object.entries(IMAGES).map(([key, url], i) => ({
    filename: `${key}.jpg`,
    url,
    mimeType: 'image/jpeg',
    size: 120000 + i * 8000,
    width: 900,
    height: 1200,
    alt: key.replace(/[0-9]/g, ' ').trim(),
    folder: 'products',
  }));
  await prisma.media.createMany({ data: mediaFiles });

  await prisma.newsletter.createMany({
    data: [
      { email: 'subscriber1@example.com' }, { email: 'subscriber2@example.com' },
      { email: 'subscriber3@example.com' }, { email: 'subscriber4@example.com' },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'SEED', entity: 'system', meta: JSON.stringify({ products: products.length, orders: orderCount }) },
    ],
  });

  console.log('\n✅ Seed complete!\n');
  console.log('   Admin login:    admin@bdmarket.com.bd / admin123');
  console.log('   Manager login:  manager@bdmarket.com.bd / staff123');
  console.log('   Customer login: rahim@example.com / customer123');
  console.log(`   Admin panel:    http://localhost:3000/admin\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
