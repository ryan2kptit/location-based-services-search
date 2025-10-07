import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSpatialIndexes1759803083751 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing regular indexes on location columns
        await queryRunner.query(`DROP INDEX IF EXISTS IDX_services_location ON services`);
        await queryRunner.query(`DROP INDEX IF EXISTS IDX_user_locations_location ON user_locations`);

        // Create proper SPATIAL indexes on POINT geometry columns
        await queryRunner.query(`CREATE SPATIAL INDEX IDX_services_location_spatial ON services(location)`);
        await queryRunner.query(`CREATE SPATIAL INDEX IDX_user_locations_location_spatial ON user_locations(location)`);

        console.log('✅ SPATIAL indexes created successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop SPATIAL indexes
        await queryRunner.query(`DROP INDEX IF EXISTS IDX_services_location_spatial ON services`);
        await queryRunner.query(`DROP INDEX IF EXISTS IDX_user_locations_location_spatial ON user_locations`);

        // Recreate regular indexes (fallback)
        await queryRunner.query(`CREATE INDEX IDX_services_location ON services(latitude, longitude)`);
        await queryRunner.query(`CREATE INDEX IDX_user_locations_location ON user_locations(latitude, longitude)`);

        console.log('⏪ SPATIAL indexes rolled back');
    }

}
