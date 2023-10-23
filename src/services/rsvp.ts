import { CustomerService, TransactionBaseService } from "@medusajs/medusa";
import { EntityManager, Equal } from "typeorm";
import RSVPRepository from "src/repositories/rsvp";
import { RSVP } from "src/models/rsvp";
import { UpdateRSVPInput } from "src/types/rsvp";

type InjectedDependencies = {
  manager: EntityManager;
  rsvpRepository: typeof RSVPRepository;
  customerService: CustomerService;
};

class RSVPService extends TransactionBaseService {
  protected rsvpRepository_: typeof RSVPRepository;
  protected customerService_: CustomerService;

  constructor({ rsvpRepository, customerService }: InjectedDependencies) {
    super(arguments[0]);

    this.rsvpRepository_ = rsvpRepository;
    this.customerService_ = customerService;
  }

  async retrieve(id: RSVP["id"]): Promise<RSVP | undefined> {
    const rsvpRepo = this.activeManager_.withRepository(this.rsvpRepository_);

    const status = await rsvpRepo.findOne({
      where: { id: Equal(id) },
    });

    return status;
  }

  async create(data: Required<UpdateRSVPInput>): Promise<RSVP> {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const rsvpRepo = transactionManager.withRepository(
          this.rsvpRepository_
        );

        let customer = null;
        if (data.customer_id) {
          customer = await this.customerService_.retrieve(data.customer_id);
        }

        const created = rsvpRepo.create({
          name: data.name,
          is_attending: data.is_attending,
          amountOfGuests: data.amount_of_guests,
          customer,
        });

        return rsvpRepo.save(created);
      }
    );
  }

  async update(id: RSVP["id"], data: UpdateRSVPInput): Promise<RSVP> {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const rsvpRepo = transactionManager.withRepository(
          this.rsvpRepository_
        );

        const rsvp = await this.retrieve(id);

        for (const [key, value] of Object.entries(data)) {
          rsvp[key] = value;
        }

        return await rsvpRepo.save(rsvp);
      }
    );
  }
}

export default RSVPService;
