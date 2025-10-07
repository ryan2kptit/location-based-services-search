import { DataSource, EntityManager, Repository, ObjectLiteral } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export class DatabaseHelper {
  private dataSource: DataSource;

  constructor(private configService?: ConfigService) {}

  async createTestConnection(): Promise<DataSource> {
    const dataSource = new DataSource({
      type: 'postgres',
      host: this.configService?.get('DATABASE_HOST') || 'localhost',
      port: this.configService?.get('DATABASE_PORT') || 5432,
      username: this.configService?.get('DATABASE_USER') || 'postgres',
      password: this.configService?.get('DATABASE_PASSWORD') || 'postgres',
      database: this.configService?.get('DATABASE_NAME') || 'test_db',
      entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    this.dataSource = await dataSource.initialize();
    return this.dataSource;
  }

  async closeConnection(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  async clearDatabase(manager?: EntityManager): Promise<void> {
    const entityManager = manager || this.dataSource.manager;
    const entities = this.dataSource.entityMetadatas;

    // Disable foreign key checks
    await entityManager.query('SET session_replication_role = replica;');

    // Truncate all tables
    for (const entity of entities) {
      const repository = entityManager.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }

    // Re-enable foreign key checks
    await entityManager.query('SET session_replication_role = DEFAULT;');
  }

  async enableSpatialSupport(): Promise<void> {
    // MySQL 8.0+ has built-in spatial support, no extension needed
    // This method is kept for compatibility but does nothing for MySQL
  }

  async seedDatabase(entities: { repository: string; data: any[] }[]): Promise<void> {
    for (const { repository, data } of entities) {
      const repo = this.dataSource.getRepository(repository);
      await repo.save(data);
    }
  }

  getRepository<T extends ObjectLiteral>(entity: any): Repository<T> {
    return this.dataSource.getRepository(entity) as Repository<T>;
  }

  getManager(): EntityManager {
    return this.dataSource.manager;
  }
}

export const createMockRepository = <T = any>() => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
  })),
});

export const resetMocks = (...mocks: any[]) => {
  mocks.forEach((mock) => {
    if (mock && typeof mock === 'object') {
      Object.keys(mock).forEach((key) => {
        if (typeof mock[key]?.mockReset === 'function') {
          mock[key].mockReset();
        }
      });
    }
  });
};
