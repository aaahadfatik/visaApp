import { Service } from "../../entity";
import { dataSource } from '../../datasource';
import { authenticate } from '../../utils/authUtils';
import { Not } from "typeorm";

const serviceResolvers = {
  Query: {
    getServices: async () => {
      const serviceRepository = dataSource.getRepository(Service);
      return await serviceRepository.find();
    },
    getServiceById: async (_: any, { id }: { id: string }) => {
      const serviceRepository = dataSource.getRepository(Service);
      return await serviceRepository.findOne({ where: { id } });
    },
    getPopularServices: async (_: any, { limit }: { limit: number }) => {
      const serviceRepository = dataSource.getRepository(Service);
      return await serviceRepository.find({
        order: { createdAt: "DESC" }, // Assuming "views" column exists
        take: limit,
      });
    },
  },

  Mutation: {
    createService: async (_: any, { input }: { input: Partial<Service> }, context: any) => {
      const usercxt = await authenticate(context);
      const serviceRepository = dataSource.getRepository(Service);

      const service = serviceRepository.create(input);
      return await serviceRepository.save(service);
    },
    updateService: async (_: any, { input }: { input: Partial<Service> }) => {
      const serviceRepository = dataSource.getRepository(Service);
      const existingService = await serviceRepository.findOne({ where: { id: input.id } });
      
      if (!existingService) throw new Error("Service not found");
      Object.assign(existingService, input);
      await serviceRepository.save(existingService);

      return existingService;
    },
  },
};

export default serviceResolvers;
