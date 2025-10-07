import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class UpdateServicesTable1759721841397 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to services table
        await queryRunner.addColumn('services', new TableColumn({
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: true,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'state',
            type: 'varchar',
            length: '100',
            isNullable: true,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: true,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'postalCode',
            type: 'varchar',
            length: '20',
            isNullable: true,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'openingHours',
            type: 'json',
            isNullable: true,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'priceRange',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'tags',
            type: 'text',
            isNullable: true,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'pending', 'closed'],
            default: "'active'",
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'isVerified',
            type: 'boolean',
            default: false,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'isFeatured',
            type: 'boolean',
            default: false,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'viewCount',
            type: 'int',
            default: 0,
        }));

        await queryRunner.addColumn('services', new TableColumn({
            name: 'favoriteCount',
            type: 'int',
            default: 0,
        }));

        // Change address column type from text to varchar(500)
        await queryRunner.changeColumn('services', 'address', new TableColumn({
            name: 'address',
            type: 'varchar',
            length: '500',
            isNullable: true,
        }));

        // Change images column from json to text (for simple-array)
        await queryRunner.changeColumn('services', 'images', new TableColumn({
            name: 'images',
            type: 'text',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert changes
        await queryRunner.dropColumn('services', 'city');
        await queryRunner.dropColumn('services', 'state');
        await queryRunner.dropColumn('services', 'country');
        await queryRunner.dropColumn('services', 'postalCode');
        await queryRunner.dropColumn('services', 'openingHours');
        await queryRunner.dropColumn('services', 'priceRange');
        await queryRunner.dropColumn('services', 'tags');
        await queryRunner.dropColumn('services', 'status');
        await queryRunner.dropColumn('services', 'isVerified');
        await queryRunner.dropColumn('services', 'isFeatured');
        await queryRunner.dropColumn('services', 'viewCount');
        await queryRunner.dropColumn('services', 'favoriteCount');

        // Revert address column
        await queryRunner.changeColumn('services', 'address', new TableColumn({
            name: 'address',
            type: 'text',
        }));

        // Revert images column
        await queryRunner.changeColumn('services', 'images', new TableColumn({
            name: 'images',
            type: 'json',
            isNullable: true,
        }));
    }

}
