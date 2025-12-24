import { dataSource } from '../../datasource';
import { Document,User } from '../../entity';
import { UpdateDocumentInput } from 'types';

const documentRepo = dataSource.getRepository(Document);
const userRepo = dataSource.getRepository(User);


const documentResolver = {
  Query: {
    getDocuments: async (_: any, { limit, offset }: { limit: number; offset: number }) => {
      const documentRepo = dataSource.getRepository(Document);
      const [documents,total] =  await documentRepo.findAndCount({
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' },
        relations: ['uploadedBy'],
      });
      return {documents,total}
    },
    getDocument: async (_: any, { id }: { id: string }) => {
      const documentRepo = dataSource.getRepository(Document);
      return await documentRepo.findOne({
        where: { id },
        relations: ['uploadedBy'],
      });
    },
  },
  Mutation: {
    createDocument: async (_: any, { input }: { input: any }) => {
      const documentRepo = dataSource.getRepository(Document);
      const userRepo = dataSource.getRepository(User);

      const uploader = await userRepo.findOne({ where: { id: input.uploadedById } });
      if (!uploader) throw new Error('Uploader not found');

      const newDoc = documentRepo.create({
        ...input,
        uploadedBy: uploader,
        uploadedAt: new Date(),
      });

      return await documentRepo.save(newDoc);
    },
    updateDocument: async (_: any, { input }: { input: UpdateDocumentInput }) => {
      const doc = await documentRepo.findOne({ where:{id:input.id}  });
      if (!doc) throw new Error('User not found');

      Object.assign(doc, input);
      
      return await documentRepo.save(doc);
    },
    deleteDocument: async (_: any, { id }: { id: string }) => {
      const documentRepo = dataSource.getRepository(Document);
      const result = await documentRepo.delete(id);
      return result.affected === 1;
    },
  },
};

export default documentResolver;