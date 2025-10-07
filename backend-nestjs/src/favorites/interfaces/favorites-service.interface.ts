import { Favorite } from '../entities/favorite.entity';
import { CreateFavoriteDto } from '../dto/create-favorite.dto';

export interface IFavoritesService {
  create(userId: string, createFavoriteDto: CreateFavoriteDto): Promise<Favorite>;
  findAll(userId: string): Promise<Favorite[]>;
  findOne(userId: string, id: string): Promise<Favorite>;
  remove(userId: string, id: string): Promise<void>;
  isFavorite(userId: string, serviceId: string): Promise<boolean>;
  getFavoritesByServiceType(userId: string, serviceTypeId: string): Promise<Favorite[]>;
}
