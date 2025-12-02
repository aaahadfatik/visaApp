import { Application, User,Document } from '../../entity';
import { dataSource } from '../../datasource';
import { authenticate } from '../../utils/authUtils';
import { CreateApplicationInput} from '../../types';
import { VisaType } from 'enum';

const applicationRepository = dataSource.getRepository(Application);
const userRepository = dataSource.getRepository(User);
const documentRepository = dataSource.getRepository(Document);

const applicationResolvers = {
  Query: {
    getApplications: async(_:any,{take,skip}:{take:number,skip:number},context: any)=>{
        const authUser = await authenticate(context);
        const user= await userRepository.findOne({where:{id:authUser.userId}})
        if (!user) {
            throw new Error('Applicent not found');
        }
        const applications = await applicationRepository.find({
            where: { applicant: user },
            relations: ['applicant','files','service'],
            order:{createdAt:'DESC'},
            take: take,
            skip: skip,
        });
        return applications
    },
    getApplication: async (_: any, { id }: { id: string }) => {
        return await applicationRepository.findOne({
          where: { id },
            relations: ['applicant','files','service'],
        });
    },
  },
  Mutation: {       
    createApplication: async (_: any, { input }: { input: CreateApplicationInput },context: any) => {
        const authUser = await authenticate(context);
        const user= await userRepository.findOne({where:{id:authUser.userId}})
        if (!user) throw new Error('Applicent not found');

        const { files, passengers, passengerCount, ...rest } = input;

        const application = applicationRepository.create({
            ...rest,
            visaType: input.visaType as VisaType,
            applicant: user,
            service: input.serviceId ? { id: input.serviceId } : undefined,
            passengerCount,
        });

        const newApp = await applicationRepository.save(application);

        // Process file uploads
        for (const file of input.files) {

            const document = documentRepository.create({
            title: file.title,
            fileName: file.fileName,
            fileType: file.fileType,
            filePath: "processedFilePath",
            description: file.description,
            });

            await documentRepository.save(document);
        }

        const updatedApp = await applicationRepository.findOne({
            where: { id: newApp.id },
            relations: ['files'],
          });
        
        return updatedApp;
    },
    // updateApplication: async (_: any, { input }: { input: any }) => {
    //     const application = await applicationRepository.findOne({ where: { id: input.id } });
    //     if (!application) {
    //         throw new Error('Application not found');
    //     }
    //     Object.assign(application, input);
    //     await applicationRepository.save(application);
    //     return application;
    // },
    deleteApplication: async (_: any, { id }: { id: string }) => {
        const application = await applicationRepository.findOne({ where: { id } });
        if (!application) {
            throw new Error('Application not found');
        }
        await applicationRepository.remove(application);
        return true;
    }
  }
};

export default applicationResolvers;