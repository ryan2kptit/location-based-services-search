import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ServiceType } from './service-type.entity';

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  CLOSED = 'closed',
}

@Entity('services')
@Index(['serviceTypeId'])
@Index(['location'], { spatial: true })
@Index(['status'])
@Index(['isVerified'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 36 })
  serviceTypeId: string;

  @Column({
    type: 'point',
    spatialFeatureType: 'Point',
    srid: 4326,
    select: false,
  })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  longitude: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string | null;

  @Column({ type: 'json', nullable: true })
  openingHours: Record<string, any> | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, default: 0 })
  rating: number | null;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceRange: number | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  images: string[] | null;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE,
  })
  status: ServiceStatus;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  favoriteCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => ServiceType, (serviceType) => serviceType.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceTypeId' })
  serviceType: ServiceType;
}
