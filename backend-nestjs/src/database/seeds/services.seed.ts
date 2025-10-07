import { DataSource } from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { ServiceType } from '../../services/entities/service-type.entity';

export async function seedServices(dataSource: DataSource) {
  console.log('Seeding services...');

  const serviceRepository = dataSource.getRepository(Service);
  const serviceTypeRepository = dataSource.getRepository(ServiceType);

  // Get service types
  const restaurantType = await serviceTypeRepository.findOne({
    where: { slug: 'restaurant' },
  });
  const hospitalType = await serviceTypeRepository.findOne({
    where: { slug: 'hospital' },
  });
  const hotelType = await serviceTypeRepository.findOne({
    where: { slug: 'hotel' },
  });
  const shoppingType = await serviceTypeRepository.findOne({
    where: { slug: 'shopping-mall' },
  });
  const entertainmentType = await serviceTypeRepository.findOne({
    where: { slug: 'cinema' },
  });

  if (!restaurantType || !hospitalType || !hotelType || !shoppingType || !entertainmentType) {
    console.log('Service types not found. Please run service-types seed first.');
    return;
  }

  // Hanoi services (around latitude: 21.0285, longitude: 105.8542)
  const hanoiServices = [
    {
      name: 'Highlands Coffee - Hoan Kiem',
      description: 'Vietnamese coffee chain in the heart of Hanoi',
      latitude: 21.0285,
      longitude: 105.8542,
      address: '1 Dinh Tien Hoang St, Hoan Kiem, Hanoi',
      phone: '+842438248000',
      email: 'hoankiem@highlands.vn',
      serviceTypeId: restaurantType.id,
      rating: 4.5,
      reviewCount: 120,
      tags: ['coffee', 'wifi', 'workspace'],
      status: 'active',
    },
    {
      name: 'Pho Thin Bo Ho',
      description: 'Famous Hanoi beef pho restaurant',
      latitude: 21.0350,
      longitude: 105.8500,
      address: '61 Dinh Tien Hoang St, Hoan Kiem, Hanoi',
      phone: '+842439260567',
      serviceTypeId: restaurantType.id,
      rating: 4.7,
      reviewCount: 450,
      tags: ['pho', 'local food', 'traditional'],
      status: 'active',
    },
    {
      name: 'Bach Mai Hospital',
      description: 'Major general hospital in Hanoi',
      latitude: 21.0045,
      longitude: 105.8412,
      address: '78 Giai Phong St, Dong Da, Hanoi',
      phone: '+842438691919',
      email: 'info@bvbachmai.vn',
      website: 'http://benhvienbachmai.vn',
      serviceTypeId: hospitalType.id,
      rating: 4.0,
      reviewCount: 80,
      tags: ['emergency', '24/7', 'general hospital'],
      status: 'active',
    },
    {
      name: 'Vincom Center Ba Trieu',
      description: 'Large shopping mall in central Hanoi',
      latitude: 21.0140,
      longitude: 105.8450,
      address: '191 Ba Trieu St, Hoan Kiem, Hanoi',
      phone: '+842439747000',
      website: 'http://vincom.com.vn',
      serviceTypeId: shoppingType.id,
      rating: 4.3,
      reviewCount: 200,
      tags: ['shopping', 'cinema', 'food court'],
      status: 'active',
    },
    {
      name: 'Lotte Hotel Hanoi',
      description: 'Luxury 5-star hotel in downtown Hanoi',
      latitude: 21.0215,
      longitude: 105.8448,
      address: '54 Lieu Giai St, Ba Dinh, Hanoi',
      phone: '+842433333000',
      email: 'reserve@lotte.vn',
      website: 'http://lottehotel.com/hanoi',
      serviceTypeId: hotelType.id,
      rating: 4.8,
      reviewCount: 350,
      tags: ['luxury', '5-star', 'pool', 'spa'],
      status: 'active',
    },
    {
      name: 'The Gioi Di Dong - Hoan Kiem',
      description: 'Electronics and mobile phone store',
      latitude: 21.0295,
      longitude: 105.8520,
      address: '45 Hang Bai St, Hoan Kiem, Hanoi',
      phone: '+842438255555',
      serviceTypeId: shoppingType.id,
      rating: 4.2,
      reviewCount: 95,
      tags: ['electronics', 'mobile phones', 'warranty'],
      status: 'active',
    },
    {
      name: 'CGV Vincom Mega Mall Royal City',
      description: 'Modern cinema complex',
      latitude: 20.9989,
      longitude: 105.8214,
      address: '72A Nguyen Trai St, Thanh Xuan, Hanoi',
      phone: '+842462967920',
      website: 'http://cgv.vn',
      serviceTypeId: entertainmentType.id,
      rating: 4.5,
      reviewCount: 280,
      tags: ['cinema', '3D', 'IMAX'],
      status: 'active',
    },
    {
      name: 'Starbucks Coffee - Hoan Kiem Lake',
      description: 'International coffee chain with lake view',
      latitude: 21.0289,
      longitude: 105.8521,
      address: '2 Le Thai To St, Hoan Kiem, Hanoi',
      phone: '+842438240068',
      serviceTypeId: restaurantType.id,
      rating: 4.4,
      reviewCount: 180,
      tags: ['coffee', 'wifi', 'lake view'],
      status: 'active',
    },
  ];

  // HCMC services (around latitude: 10.7769, longitude: 106.7009)
  const hcmcServices = [
    {
      name: 'The Coffee House - District 1',
      description: 'Popular Vietnamese coffee chain',
      latitude: 10.7769,
      longitude: 106.7009,
      address: '26-28 Ly Tu Trong St, District 1, HCMC',
      phone: '+842838236299',
      serviceTypeId: restaurantType.id,
      rating: 4.6,
      reviewCount: 320,
      tags: ['coffee', 'wifi', 'modern'],
      status: 'active',
    },
    {
      name: 'Cho Ray Hospital',
      description: 'Largest general hospital in HCMC',
      latitude: 10.7563,
      longitude: 106.6642,
      address: '201B Nguyen Chi Thanh St, District 5, HCMC',
      phone: '+842838552000',
      email: 'info@choray.vn',
      website: 'http://choray.vn',
      serviceTypeId: hospitalType.id,
      rating: 4.1,
      reviewCount: 150,
      tags: ['emergency', '24/7', 'general hospital'],
      status: 'active',
    },
    {
      name: 'Saigon Centre',
      description: 'Premium shopping mall in District 1',
      latitude: 10.7823,
      longitude: 106.7005,
      address: '65 Le Loi St, District 1, HCMC',
      phone: '+842838294888',
      website: 'http://saigoncentre.com.vn',
      serviceTypeId: shoppingType.id,
      rating: 4.4,
      reviewCount: 280,
      tags: ['shopping', 'luxury', 'dining'],
      status: 'active',
    },
    {
      name: 'Hotel Continental Saigon',
      description: 'Historic luxury hotel in downtown HCMC',
      latitude: 10.7767,
      longitude: 106.7020,
      address: '132-134 Dong Khoi St, District 1, HCMC',
      phone: '+842438299201',
      email: 'reservation@continentalhotel.com.vn',
      website: 'http://continentalsaigon.com',
      serviceTypeId: hotelType.id,
      rating: 4.7,
      reviewCount: 420,
      tags: ['luxury', 'historic', 'colonial'],
      status: 'active',
    },
    {
      name: 'Pho Hoa Pasteur',
      description: 'Famous traditional pho restaurant',
      latitude: 10.7825,
      longitude: 106.6976,
      address: '260C Pasteur St, District 3, HCMC',
      phone: '+842838297943',
      serviceTypeId: restaurantType.id,
      rating: 4.8,
      reviewCount: 520,
      tags: ['pho', 'traditional', 'local food'],
      status: 'active',
    },
    {
      name: 'Galaxy Cinema - Nguyen Du',
      description: 'Modern cinema with latest technology',
      latitude: 10.7883,
      longitude: 106.6947,
      address: '116 Nguyen Du St, District 1, HCMC',
      phone: '+842838222277',
      website: 'http://galaxycine.vn',
      serviceTypeId: entertainmentType.id,
      rating: 4.5,
      reviewCount: 390,
      tags: ['cinema', '3D', 'Dolby Atmos'],
      status: 'active',
    },
    {
      name: 'Ben Thanh Market',
      description: 'Historic central market and shopping destination',
      latitude: 10.7726,
      longitude: 106.6981,
      address: 'Le Loi St, District 1, HCMC',
      phone: '+842838297914',
      serviceTypeId: shoppingType.id,
      rating: 4.2,
      reviewCount: 850,
      tags: ['market', 'souvenirs', 'local products'],
      status: 'active',
    },
    {
      name: 'Vincom Center Dong Khoi',
      description: 'Upscale shopping center in the heart of HCMC',
      latitude: 10.7780,
      longitude: 106.7034,
      address: '72 Le Thanh Ton St, District 1, HCMC',
      phone: '+842838368888',
      website: 'http://vincom.com.vn',
      serviceTypeId: shoppingType.id,
      rating: 4.5,
      reviewCount: 310,
      tags: ['shopping', 'luxury brands', 'cinema'],
      status: 'active',
    },
  ];

  // Insert services using raw query to handle POINT data correctly
  const allServices = [...hanoiServices, ...hcmcServices];

  for (const serviceData of allServices) {
    const { v4: uuidv4 } = require('uuid');
    const uuid = uuidv4();

    const insertQuery = `
      INSERT INTO services (
        id, name, description, address, latitude, longitude, location,
        phone, email, website, serviceTypeId, rating, reviewCount, tags, status,
        createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ST_SRID(POINT(?, ?), 4326),
        ?, ?, ?, ?, ?, ?, ?, ?,
        NOW(), NOW()
      )
    `;

    await serviceRepository.query(insertQuery, [
      uuid,
      serviceData.name,
      serviceData.description,
      serviceData.address,
      serviceData.latitude,
      serviceData.longitude,
      serviceData.longitude, // POINT X (longitude)
      serviceData.latitude,  // POINT Y (latitude)
      serviceData.phone || null,
      serviceData.email || null,
      serviceData.website || null,
      serviceData.serviceTypeId,
      serviceData.rating || 0,
      serviceData.reviewCount || 0,
      serviceData.tags ? serviceData.tags.join(',') : null,
      serviceData.status,
    ]);
  }

  console.log(`✓ Successfully seeded ${allServices.length} services (${hanoiServices.length} in Hanoi, ${hcmcServices.length} in HCMC)`);
}
