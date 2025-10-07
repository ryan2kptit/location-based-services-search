import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Service } from '../services/entities/service.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { IFavoritesService } from './interfaces/favorites-service.interface';

@Injectable()
export class FavoritesService implements IFavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<Favorite> {
    const { serviceId } = createFavoriteDto;

    // Check if service exists
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if already favorited
    const existingFavorite = await this.favoriteRepository.findOne({
      where: { userId, serviceId },
    });

    if (existingFavorite) {
      throw new ConflictException('Service is already in favorites');
    }

    // Use transaction to ensure atomicity of favorite creation and count increment
    return await this.dataSource.transaction(async (entityManager) => {
      // Create favorite
      const favorite = entityManager.create(Favorite, {
        userId,
        serviceId,
      });

      await entityManager.save(favorite);

      // Increment favorite count on service
      await entityManager.increment(Service, { id: serviceId }, 'favoriteCount', 1);

      return favorite;
    });
  }

  async findAll(userId: string): Promise<Favorite[]> {
    return this.favoriteRepository.find({
      where: { userId },
      relations: ['service', 'service.serviceType'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Favorite> {
    const favorite = await this.favoriteRepository.findOne({
      where: { id, userId },
      relations: ['service', 'service.serviceType'],
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return favorite;
  }

  async remove(userId: string, id: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { id, userId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    // Use transaction to ensure atomicity of favorite deletion and count decrement
    await this.dataSource.transaction(async (entityManager) => {
      // Decrement favorite count on service
      await entityManager.decrement(
        Service,
        { id: favorite.serviceId },
        'favoriteCount',
        1,
      );

      // Remove favorite
      await entityManager.remove(favorite);
    });
  }

  async isFavorite(userId: string, serviceId: string): Promise<boolean> {
    const count = await this.favoriteRepository.count({
      where: { userId, serviceId },
    });

    return count > 0;
  }

  async getFavoritesByServiceType(
    userId: string,
    serviceTypeId: string,
  ): Promise<Favorite[]> {
    return this.favoriteRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.service', 'service')
      .leftJoinAndSelect('service.serviceType', 'serviceType')
      .where('favorite.userId = :userId', { userId })
      .andWhere('service.serviceTypeId = :serviceTypeId', { serviceTypeId })
      .orderBy('favorite.createdAt', 'DESC')
      .getMany();
  }
}
