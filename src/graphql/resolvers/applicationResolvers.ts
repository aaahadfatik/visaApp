import { Application, User,Document } from '../../entity';
import { dataSource } from '../../datasource';
import { authenticate } from '../../utils/authUtils';
import { CreateUserInput, UpdateUserInput } from '../../types';
import { create } from 'domain';

const userResolvers = {
  Query: {
    getApplications: async(_:any,{take,skip}:{take:number,skip:number},context: any)=>{
        const authUser = await authenticate(context);
        const applicationRepository = dataSource.getRepository(Application);
        const userRepository = dataSource.getRepository(User);
        const user= await userRepository.findOne({where:{id:authUser.userId}})
        if (!user) {
            throw new Error('Applicent not found');
        }
        const applications = await applicationRepository.find({
            where: { applicant: user },
            relations: ['applicant','files'],
            order:{createdAt:'DESC'},
            take: take,
            skip: skip,
        });
        return applications
    },
    getApplication: async (_: any, { id }: { id: string }) => {
        const applicationRepository = dataSource.getRepository(Application);
        return await applicationRepository.findOne({
          where: { id },
            relations: ['applicant','files'],
        });
    },
  },
  Mutation: {       
    createApplication: async (_: any, { input }: { input: any },context: any) => {
        const authUser = await authenticate(context);
        const applicationRepository = dataSource.getRepository(Application);
        const userRepository = dataSource.getRepository(User);
        const user= await userRepository.findOne({where:{id:authUser.userId}})
        if (!user) {
            throw new Error('Applicent not found');
        }
        const application = applicationRepository.create({
            ...input,
            applicant: user,
        });
        await applicationRepository.save(application);
        return application;
    },
    updateApplication: async (_: any, { input }: { input: any }) => {
        const applicationRepository = dataSource.getRepository(Application);
        const application = await applicationRepository.findOne({ where: { id: input.id } });
        if (!application) {
            throw new Error('Application not found');
        }
        Object.assign(application, input);
        await applicationRepository.save(application);
        return application;
    },
    deleteApplication: async (_: any, { id }: { id: string }) => {
        const applicationRepository = dataSource.getRepository(Application);
        const application = await applicationRepository.findOne({ where: { id } });
        if (!application) {
            throw new Error('Application not found');
        }
        await applicationRepository.remove(application);
        return true;
    }
  }
};

export default userResolvers;