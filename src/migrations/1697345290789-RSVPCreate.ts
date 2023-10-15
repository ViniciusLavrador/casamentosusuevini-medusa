import { MigrationInterface, QueryRunner } from "typeorm";

export class RSVPCreate1697345290789 implements MigrationInterface {
  name = "RSVPCreate1697345290789";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "rsvp" (
            "id" character varying NOT NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "is_attending" boolean NOT NULL,
            "name" character varying NOT NULL,
            "amountOfGuests" integer NOT NULL DEFAULT '0',
            "customer_id" character varying,
            
            CONSTRAINT "PK_33487519e664b4559d391ab71fb" PRIMARY KEY ("id"),
            CONSTRAINT "FK_c9b71cb365c688abb084c1c8be7" FOREIGN KEY ("customer_id") REFERENCES "customer"("id")
            )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rsvp"`);
  }
}
