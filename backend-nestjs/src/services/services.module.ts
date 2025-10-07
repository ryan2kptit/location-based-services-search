import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { ServicesService } from './services/services.service';
import { Service } from './entities/service.entity';
import { ServiceType } from './entities/service-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, ServiceType])],
  controllers: [ServicesController],
  providers: [
    {
      provide: 'IServicesService',
      useClass: ServicesService,
    },
    ServicesService,
  ],
  exports: ['IServicesService', ServicesService],
})
export class ServicesModule {}
