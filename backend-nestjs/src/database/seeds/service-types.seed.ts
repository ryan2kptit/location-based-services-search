import { DataSource } from 'typeorm';
import { ServiceType } from '../../services/entities/service-type.entity';

export const serviceTypesData = [
  {
    name: 'Restaurant',
    slug: 'restaurant',
    description: 'Restaurants, cafes, and dining establishments',
    icon: 'restaurant',
  },
  {
    name: 'Hospital',
    slug: 'hospital',
    description: 'Hospitals, clinics, and medical facilities',
    icon: 'local_hospital',
  },
  {
    name: 'School',
    slug: 'school',
    description: 'Schools, universities, and educational institutions',
    icon: 'school',
  },
  {
    name: 'Shopping Mall',
    slug: 'shopping-mall',
    description: 'Shopping centers and malls',
    icon: 'shopping_cart',
  },
  {
    name: 'Park',
    slug: 'park',
    description: 'Parks, gardens, and recreational areas',
    icon: 'park',
  },
  {
    name: 'Gas Station',
    slug: 'gas-station',
    description: 'Gas stations and fuel services',
    icon: 'local_gas_station',
  },
  {
    name: 'Bank',
    slug: 'bank',
    description: 'Banks and ATMs',
    icon: 'account_balance',
  },
  {
    name: 'Pharmacy',
    slug: 'pharmacy',
    description: 'Pharmacies and drugstores',
    icon: 'local_pharmacy',
  },
  {
    name: 'Hotel',
    slug: 'hotel',
    description: 'Hotels and accommodations',
    icon: 'hotel',
  },
  {
    name: 'Gym',
    slug: 'gym',
    description: 'Gyms and fitness centers',
    icon: 'fitness_center',
  },
  {
    name: 'Cinema',
    slug: 'cinema',
    description: 'Movie theaters and cinemas',
    icon: 'theaters',
  },
  {
    name: 'Library',
    slug: 'library',
    description: 'Libraries and bookstores',
    icon: 'local_library',
  },
  {
    name: 'Police Station',
    slug: 'police-station',
    description: 'Police stations and law enforcement',
    icon: 'local_police',
  },
  {
    name: 'Fire Station',
    slug: 'fire-station',
    description: 'Fire stations and emergency services',
    icon: 'fire_truck',
  },
  {
    name: 'Museum',
    slug: 'museum',
    description: 'Museums and art galleries',
    icon: 'museum',
  },
];

export async function seedServiceTypes(dataSource: DataSource): Promise<void> {
  const serviceTypeRepository = dataSource.getRepository(ServiceType);

  console.log('Seeding service types...');

  for (const data of serviceTypesData) {
    const existing = await serviceTypeRepository.findOne({
      where: { slug: data.slug },
    });

    if (!existing) {
      const serviceType = serviceTypeRepository.create(data);
      await serviceTypeRepository.save(serviceType);
      console.log(`✓ Created service type: ${data.name}`);
    } else {
      console.log(`- Service type already exists: ${data.name}`);
    }
  }

  console.log('Service types seeding completed!');
}
