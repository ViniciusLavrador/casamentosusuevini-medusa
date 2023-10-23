import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity, Customer } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";

@Entity()
export class RSVP extends BaseEntity {
  @Column({ type: "boolean", nullable: false })
  is_attending: boolean;

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({
    type: "integer",
    nullable: false,
    default: 0,
    name: "amount_of_guests",
  })
  amountOfGuests: number;

  @OneToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: "customer_id" })
  customer: Customer | null;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "rsvp");

    if (this.customer) {
      this.name = this.customer.first_name + " " + this.customer.last_name;
    } else if (!this.name) {
      throw new Error("Name is required for entities without a customer");
    }
  }
}
