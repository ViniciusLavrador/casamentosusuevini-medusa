import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class RSVPCreate1697345290789 implements MigrationInterface {
  name = "RSVPCreate1697345290789";

  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.createTable(
      new Table({
        name: "rsvp",
        columns: [
          { name: "id", type: "varchar", isPrimary: true },
          {
            name: "created_at",
            type: "timestamp with time zone",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp with time zone",
            default: "now()",
          },
          { name: "is_attending", type: "boolean", default: false },
          { name: "name", type: "varchar" },
          { name: "amount_of_guests", type: "integer", default: 0 },
          { name: "customer_id", type: "varchar", isNullable: true },
        ],
      })
    );

    await queryRunner.createForeignKey(
      "rsvp",
      new TableForeignKey({
        columnNames: ["customer_id"],
        referencedTableName: "customer",
        referencedColumnNames: ["id"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("rsvp", true, true, true);
  }
}
