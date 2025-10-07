import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { Favorite } from './entities/favorite.entity';
import { Service } from '../services/entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Service])],
  controllers: [FavoritesController],
  providers: [
    {
      provide: 'IFavoritesService',
      useClass: FavoritesService,
    },
    FavoritesService,
  ],
  exports: ['IFavoritesService', FavoritesService],
})
export class FavoritesModule {}
