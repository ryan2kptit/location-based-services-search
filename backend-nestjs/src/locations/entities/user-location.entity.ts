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
import { User } from '../../users/entities/user.entity';

@Entity('user_locations')
@Index(['userId'])
@Index(['latitude', 'longitude'])
export class UserLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  address: string;

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

  @Column({
    type: 'point',
    select: false, // Exclude from automatic SELECT queries to avoid AsText issue
  })
  location: any;

  @Column({
    type: 'enum',
    enum: ['home', 'work', 'other'],
    default: 'other',
  })
  type: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
