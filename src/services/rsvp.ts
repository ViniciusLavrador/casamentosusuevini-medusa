import { TransactionBaseService } from "@medusajs/medusa";
import { EntityManager, Equal } from "typeorm";
import RSVPRepository from "src/repositories/rsvp";
import { RSVP } from "src/models/rsvp";
import { UpdateRSVPInput } from "src/types/rsvp";

type InjectedDependencies = {
  manager: EntityManager;
  rsvpRepository: typeof RSVPRepository;
};

class RSVPService extends TransactionBaseService {
  protected rsvpRepository_: typeof RSVPRepository;

  constructor({ rsvpRepository }: InjectedDependencies) {
    super(arguments[0]);

    this.rsvpRepository_ = rsvpRepository;
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

        const rsvp = await rsvpRepo.insert({
          name: data.name,
          is_attending: data.is_attending,
          amountOfGuests: data.amountOfGuests,
        });

        return await this.retrieve(rsvp.identifiers[0].id);
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
