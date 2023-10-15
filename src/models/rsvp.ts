import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { BaseEntity, Customer, User } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";

@Entity()
export class RSVP extends BaseEntity {
  @Column({ type: "boolean", nullable: false })
  is_attending: boolean;

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "integer", nullable: false, default: 0 })
  amountOfGuests: number;

  @OneToOne(() => Customer, (customer) => customer.id, { nullable: true })
  @JoinColumn()
  customer: Customer;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "rsvp");

    if (this.customer) {
      this.name = `${this.customer.first_name} ${this.customer.last_name}`;
    } else if (!this.name) {
      throw new Error("Name is required for RSVPs without a customer");
    }
  }
}
