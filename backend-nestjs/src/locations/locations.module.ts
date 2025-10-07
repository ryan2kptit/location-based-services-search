import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { UserLocation } from './entities/user-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation])],
  controllers: [LocationsController],
  providers: [
    {
      provide: 'ILocationsService',
      useClass: LocationsService,
    },
    LocationsService,
  ],
  exports: ['ILocationsService', LocationsService],
})
export class LocationsModule {}
