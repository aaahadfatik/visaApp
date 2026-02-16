import {
  Category,
  Form,
  FormAttribute,
  FormSubmission,
  Service,
  Visa,
  Document,
  Notification,
  User,
  CategoryAttribute,
} from "../../entity";
import { dataSource } from "../../datasource";
import { authenticate } from "../../utils/authUtils";
import { sendNotification } from "../../server";
import {
  CreateServiceInput,
  UpdateServiceInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateVisaInput,
  UpdateVisaInput,
  CreateFormInput,
  FormAttributeInput,
  SubmitFormInput,
  FormFilter,
  UpdateCategoryAttributeInput,
} from "types";
import { AttributeType, FormStatus } from "../../enum"; // Import your enum
import { ILike } from "typeorm";
import { pubsub } from "../../server";
import { logger } from "../../utils/logger";

const serviceRepo = dataSource.getRepository(Service);
const categoryRepo = dataSource.getRepository(Category);
const visaRepo = dataSource.getRepository(Visa);
const formRepo = dataSource.getRepository(Form);
const submissionRepo = dataSource.getRepository(FormSubmission);
const documentRepo = dataSource.getRepository(Document);
const notificationRepository = dataSource.getRepository(Notification);
const userRepository = dataSource.getRepository(User);
const categoryRepository = dataSource.getRepository(Category);
const categoryAttributeRepo = dataSource.getRepository(CategoryAttribute);

const serviceResolvers = {
  FormSubmission: {
    formId: (parent: any) => {
      // If it's a mapped object, return formId directly, otherwise get from form relation
      return parent.formId || parent.form?.id || null;
    },
    createdBy: async (parent: any, _: any) => {
      // parent.createdBy might be an object or a string ID
      if (!parent.createdBy) return null;
      if (typeof parent.createdBy === "object") return parent.createdBy;
      return userRepository.findOne({
        where: { id: parent.createdBy },
      });
    },
    category: async (parent: any) => {
      if (parent.category) return parent.category;
      const catId = parent.categoryId || parent.category?.id;
      if (catId) {
        return categoryRepo.findOne({ where: { id: catId } });
      }
      return null;
    },
    visa: async (parent: any) => {
      if (parent.visa) return parent.visa;
      const vId = parent.visaId || parent.visa?.id;
      if (vId) {
        return visaRepo.findOne({ where: { id: vId }, relations: ["category"] });
      }
      return null;
    },
  },

  Query: {
    getServices: async (_: any, { search }: { search?: string }) => {
      const services = await serviceRepo.find({
        where: { isDeleted: false },
        relations: [
          "categories",
          "categories.submissions",
          "categories.visas",
          "categories.visas.form",
          "categories.visas.form.attributes",
        ],
      });

      const keyword = search?.toLowerCase();

      const filtered = keyword
        ? services.filter(
          (service) =>
            service.title.toLowerCase().includes(keyword) ||
            service.categories?.some(
              (category) =>
                category.title?.toLowerCase().includes(keyword) ||
                category.visas?.some((visa) =>
                  visa.title?.toLowerCase().includes(keyword),
                ),
            ),
        )
        : services;

      return filtered.map((service) => {
        const submissions =
          service.categories?.flatMap(
            (category) => category.submissions ?? [],
          ) ?? [];

        const pendingSubmission = submissions.filter(
          (s) => s.status === "UNDER_PROGRESS",
        ).length;

        const completedSubmission = submissions.filter(
          (s) => s.status === "COMPLETED",
        ).length;

        return {
          services: service,
          total: submissions.length,
          pendingSubmission,
          completedSubmission,
        };
      });
    },
    getServiceById: async (_: any, { id }: { id: string }) => {
      return await serviceRepo.findOne({
        where: { id, isDeleted: false },
        relations: ["categories", "categories.visas"],
      });
    },
    getCategories: async (_: any, { serviceId }: { serviceId?: string }) => {
      if (serviceId) {
        return await categoryRepo.find({
          where: { service: { id: serviceId } },
          relations: ["service"],
        });
      }
      return await categoryRepo.find({ relations: ["service"] });
    },
    getCategoryById: async (
      _: any,
      { id, search }: { id: string; search?: string },
    ) => {
      const category = await categoryRepo.findOne({
        where: { id },
        relations: ["service", "visas"],
      });

      if (!category) return null;

      if (search) {
        const keyword = search.toLowerCase();
        category.visas = category.visas.filter((visa) =>
          visa.title.toLowerCase().includes(keyword),
        );
      }

      return category;
    },
    getVisas: async (_: any, { title }: { title: string }) => {
      const whereClause = title ? { title: ILike(`%${title}%`) } : {};

      return await visaRepo.find({
        where: whereClause,
        relations: ["category", "form", "form.attributes"],
      });
    },
    getVisaById: async (_: any, { id }: { id: string }) => {
      return await visaRepo
        .createQueryBuilder("visa")
        .leftJoinAndSelect("visa.category", "category")
        .leftJoinAndSelect("visa.form", "form")
        .leftJoinAndSelect(
          "form.attributes",
          "attributes",
          "attributes.parentId IS NULL",
        )
        .leftJoinAndSelect("attributes.children", "children")
        .where("visa.id = :id", { id })
        .orderBy(
          `
          CASE 
            WHEN attributes.type = :fileType THEN 1 
            ELSE 0 
          END
        `,
          "ASC",
        )
        .addOrderBy("attributes.id", "ASC")
        .addOrderBy("children.id", "ASC") // Optional: preserve child order
        .setParameter("fileType", AttributeType.FILE)
        .getOne();
    },
    getForms: async () => {
      const forms = await formRepo
        .createQueryBuilder("form")
        .leftJoinAndSelect(
          "form.attributes",
          "attribute",
          "attribute.parentId IS NULL",
        )
        .leftJoinAndSelect("attribute.children", "children")
        .orderBy("form.id", "ASC")
        .addOrderBy("CASE WHEN children.id IS NULL THEN 0 ELSE 1 END", "ASC")
        .addOrderBy("attribute.id", "ASC")
        .getMany();

      return forms;
    },
    getFormByVisaId: async (_: any, { visaId }: { visaId: string }) => {
      const form = await formRepo
        .createQueryBuilder("form")
        .leftJoinAndSelect(
          "form.attributes",
          "attribute",
          "attribute.parentId IS NULL", // only top‑level attributes
        )
        .leftJoinAndSelect("attribute.children", "children")
        .orderBy("CASE WHEN children.id IS NULL THEN 0 ELSE 1 END", "ASC")
        .addOrderBy("attribute.id", "ASC") // secondary order, keep stable order
        .getOne();
    },
    getFormByCategoryId: async (
      _: any,
      { categoryId }: { categoryId: string },
    ) => {
      const form = await formRepo
        .createQueryBuilder("form")
        .leftJoinAndSelect(
          "form.attributes",
          "attribute",
          "attribute.parentId IS NULL", // only top‑level attributes
        )
        .leftJoinAndSelect("attribute.children", "children")
        .leftJoinAndSelect("form.category", "category")
        .where("category.id = :categoryId", { categoryId })
        .orderBy("CASE WHEN children.id IS NULL THEN 0 ELSE 1 END", "ASC")
        .addOrderBy("attribute.id", "ASC") // secondary order, keep stable order
        .getOne();
      return form;
    },
    getSubmittedForms: async (
      _: any,
      {
        limit,
        offset,
        filter,
      }: {
        limit: number;
        offset: number;
        filter?: FormFilter;
      },
    ) => {
      if (limit <= 0) {
        throw new Error("Limit must be greater than 0");
      }
      if (offset < 0) {
        throw new Error("Offset cannot be negative");
      }

      const submissionRepo = dataSource.getRepository(FormSubmission);

      const qb = submissionRepo
        .createQueryBuilder("submission")
        .leftJoinAndSelect("submission.form", "form")
        .leftJoinAndSelect("submission.visa", "visa")
        .leftJoinAndSelect("submission.category", "submissionCategory") // renamed alias to avoid conflict
        .leftJoinAndSelect("submission.payment", "payment")
        .leftJoinAndSelect("visa.category", "category")
        .leftJoinAndSelect("submission.documents", "documents")
        .orderBy("submission.createdAt", "DESC")
        .take(limit)
        .skip(offset);

      /* -------------------- Filters -------------------- */

      if (filter?.status) {
        qb.andWhere("submission.status = :status", {
          status: filter.status,
        });
      }

      if (filter?.serviceId) {
        qb.andWhere("form.serviceId = :serviceId", {
          serviceId: filter.serviceId,
        });
      }

      if (filter?.startDate || filter?.endDate) {
        qb.andWhere(
          `
          submission.createdAt >= :startDate
          AND submission.createdAt <= :endDate
          `,
          {
            startDate: filter.startDate
              ? new Date(filter.startDate)
              : new Date("1970-01-01"),
            endDate: filter.endDate ? new Date(filter.endDate) : new Date(),
          },
        );
      }

      if (filter?.search?.trim()) {
        const search = `%${filter.search.trim()}%`;

        qb.andWhere(
          `
          (
            submission.id ILIKE :search
            OR form.title ILIKE :search
            OR visa.referenceNumber ILIKE :search
          )
          `,
          { search },
        );
      }

      /* -------------------- Execute -------------------- */

      const [submissions, totalCount] = await qb.getManyAndCount();

      return {
        submissions,
        total: totalCount,
      };
    },
    getUserSubmittedForms: async (_: any, { userId }: { userId: string }) => {
      const submissionRepo = dataSource.getRepository(FormSubmission);
      const submissions = await submissionRepo
        .createQueryBuilder("submission")
        .leftJoinAndSelect("submission.form", "form")
        .leftJoinAndSelect("submission.category", "category") // join category
        .leftJoinAndSelect("category.service", "service") // join service via category
        .leftJoinAndSelect("submission.documents", "documents")
        .orderBy("submission.createdAt", "DESC")
        .where("submission.createdBy = :userId", { userId })
        .getMany();

      return submissions;
    },
    getUserSubmittedPendingForms: async (
      _: any,
      { userId }: { userId: string },
    ) => {
      const submissionRepo = dataSource.getRepository(FormSubmission);
      const submissions = await submissionRepo
        .createQueryBuilder("submission")
        .leftJoinAndSelect("submission.form", "form")
        .leftJoinAndSelect("submission.category", "category") // join category
        .leftJoinAndSelect("category.service", "service") // join service via category
        .leftJoinAndSelect("submission.documents", "documents")
        .orderBy("submission.createdAt", "DESC")
        .where("submission.createdBy = :userId", { userId })
        .andWhere("submission.status = :status", {
          status: FormStatus.UNDER_PROGRESS,
        })
        .getMany();

      return submissions;
    },
    getSubmittedFormById: async (_: any, { id }: { id: string }) => {
      const submission = await submissionRepo
        .createQueryBuilder("submission")
        .leftJoinAndSelect("submission.form", "form")
        .leftJoinAndSelect("submission.visa", "visa")
        .leftJoinAndSelect("submission.category", "submissionCategory") // join category directly from submission
        .leftJoinAndSelect("submission.payment", "payment") // join payment
        .leftJoinAndSelect("visa.category", "category") // join category from visa
        .leftJoinAndSelect("category.service", "service") // join service via category
        .leftJoinAndSelect("submission.documents", "documents")
        .orderBy("submission.createdAt", "DESC")
        .where("submission.id = :id", { id })
        .getOne();

      if (!submission) {
        throw new Error("Submission not found");
      }

      return submission;
    },
    getSubmittedFormsStatistics: async (_: any, __: any) => {
      const submissionRepo = dataSource.getRepository(FormSubmission);

      const [
        totalSubmissions,
        completedSubmissions,
        underProgressSubmissions,
        rejectedSubmissions,
        returnModificationSubmissions,
      ] = await Promise.all([
        submissionRepo.count(),
        submissionRepo.count({ where: { status: FormStatus.COMPLETED } }),
        submissionRepo.count({ where: { status: FormStatus.UNDER_PROGRESS } }),
        submissionRepo.count({ where: { status: FormStatus.REJECTED } }),
        submissionRepo.count({
          where: { status: FormStatus.RETURN_MODIFICATION },
        }),
      ]);

      return {
        totalSubmissions,
        completedSubmissions,
        underProgressSubmissions,
        rejectedSubmissions,
        returnModificationSubmissions,
      };
    },
    getServiceStatistics: async (_: any, { year }: { year?: string }) => {
      const query = categoryRepository
        .createQueryBuilder("category")
        .leftJoin("category.submissions", "submission");

      if (year) {
        const start = new Date(`${year}-01-01T00:00:00.000Z`);
        const end = new Date(`${year}-12-31T23:59:59.999Z`);

        query.andWhere(
          "submission.createdAt IS NULL OR submission.createdAt BETWEEN :start AND :end",
          { start, end }
        );
      }

      const statistics = await query
        .select([
          "category.id AS serviceid",
          "category.title AS title",
          "COUNT(submission.id) AS totalapplications",
        ])
        .groupBy("category.id")
        .addGroupBy("category.title")
        .orderBy("category.title", "ASC")
        .getRawMany();

      return {
        statistics: statistics.map((s) => ({
          serciveId: s.serviceid, // typo preserved
          title: s.title,
          totalApplications: Number(s.totalapplications),
        })),
      };
    },
    getSubmittedFromAppicationStatusGraph: async (
      _: any,
      { year }: { year?: string },
    ) => {
      // 1️⃣ Build base query
      let query = submissionRepo.createQueryBuilder("submission");

      // 2️⃣ Apply year filter if provided
      if (year) {
        const start = new Date(`${year}-01-01T00:00:00.000Z`);
        const end = new Date(`${year}-12-31T23:59:59.999Z`);
        query = query.where(
          "submission.createdAt >= :start AND submission.createdAt <= :end",
          {
            start,
            end,
          },
        );
      }

      // 1️⃣ Total submissions
      const total = await query.getCount();

      // Edge case: no submissions
      if (total === 0) {
        return Object.values(FormStatus).map((status) => ({
          status,
          percentage: 0,
        }));
      }

      // 2️⃣ Count per status
      const rawStats = await query
        .select("submission.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("submission.status")
        .getRawMany();

      // Convert to map for easy lookup
      const statusCountMap = new Map<FormStatus, number>();
      rawStats.forEach((row) => {
        statusCountMap.set(row.status, Number(row.count));
      });

      // 3️⃣ Calculate percentage for ALL statuses
      const result = Object.values(FormStatus).map((status) => {
        const count = statusCountMap.get(status) ?? 0;
        const percentage = (count / total) * 100;

        return {
          status,
          percentage: Number(percentage.toFixed(2)), // clean decimals
        };
      });

      return result;
    },
  },
  Mutation: {
    createService: async (
      _: any,
      { input }: { input: CreateServiceInput },
      context: any,
    ) => {
      await authenticate(context);
      const service = serviceRepo.create({
        title: input.title,
        isForSale: input.isForSale ?? false,
        description: input.description || "",
        imageUrl: input.imageUrl || "",
      });

      if (input.categoryIds && input.categoryIds.length > 0) {
        const categories = await categoryRepo.findByIds(input.categoryIds);
        service.categories = categories;
      }

      return serviceRepo.save(service);
    },
    updateService: async (_: any, { input }: { input: UpdateServiceInput }) => {
      const service = await serviceRepo.findOne({
        where: { id: input.id },
        relations: ["categories"],
      });
      if (!service) throw new Error("Service not found");

      Object.assign(service, input);

      if (input.categoryIds) {
        const categories = await categoryRepo.findByIds(input.categoryIds);
        service.categories = categories;
      }

      return serviceRepo.save(service);
    },
    deleteService: async (_: any, { id }: { id: string }, context: any) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) throw new Error("Unauthorized");

      const service = await serviceRepo.findOne({ where: { id } });
      if (!service) throw new Error("Service not found");

      service.isDeleted = true;
      service.deletedAt = new Date();

      await serviceRepo.save(service);
      return true;
    },
    createCategory: async (
      _: any,
      { input }: { input: CreateCategoryInput },
    ) => {
      const categoryRepo = dataSource.getRepository(Category);
      const serviceRepo = dataSource.getRepository(Service);

      const service = await serviceRepo.findOne({
        where: { id: input.serviceId },
      });
      if (!service) throw new Error("Service not found");

      const category = categoryRepo.create({
        title: input.title,
        isForSale: input.isForSale ?? false,
        service,
        vipPrice: input.vipPrice || 0,
        vvipPrice: input.vvipPrice || 0,
        normalPrice: input.normalPrice || 0,
        description: input.description || [],
        info: input.info || [],
      });

      return await categoryRepo.save(category);
    },
    updateCategory: async (
      _: any,
      { input }: { input: UpdateCategoryInput },
    ) => {
      const category = await categoryRepo.findOne({
        where: { id: input.id },
        relations: ["service"],
      });
      if (!category) throw new Error("Category not found");

      // Update basic fields
      if (input.title !== undefined) category.title = input.title;
      if (input.isForSale !== undefined) category.isForSale = input.isForSale;

      // Update the service relation (if changed)
      if (input.serviceId) {
        const service = await serviceRepo.findOne({
          where: { id: input.serviceId },
        });
        if (!service) throw new Error("Service not found");
        category.service = service;
      }

      return await categoryRepo.save(category);
    },
    updateCategoryAttribute: async ({
      input,
    }: {
      input: UpdateCategoryAttributeInput;
    }) => {
      const categoryAttribute = await categoryAttributeRepo.findOne({
        where: { id: input.id },
      });
      if (!categoryAttribute) throw new Error("Category Attribute not found");

      if (input.name !== undefined) categoryAttribute.name = input.name;
      if (input.value !== undefined) categoryAttribute.value = input.value;

      await categoryAttributeRepo.save(categoryAttribute);
      return categoryAttribute;
    },
    createVisa: async (_: any, { input }: { input: CreateVisaInput }) => {
      const category = await categoryRepo.findOne({
        where: { id: input.categoryId },
      });
      if (!category) throw new Error("Category not found");

      const visa = visaRepo.create({
        ...input,
        category,
      });

      return visaRepo.save(visa);
    },
    updateVisa: async (_: any, { input }: { input: UpdateVisaInput }) => {
      const visa = await visaRepo.findOne({
        where: { id: input.id },
        relations: ["category"],
      });
      if (!visa) throw new Error("Visa not found");

      Object.assign(visa, input);

      if (input.categoryId) {
        const category = await categoryRepo.findOne({
          where: { id: input.categoryId },
        });
        if (!category) throw new Error("Category not found");
        visa.category = category;
      }

      return visaRepo.save(visa);
    },
    createForm: async (_: any, { input }: { input: CreateFormInput }) => {
      const formRepo = dataSource.getRepository(Form);
      const attrRepo = dataSource.getRepository(FormAttribute);

      const category = await categoryRepo.findOne({
        where: { id: input.categoryId },
      });
      if (!category) throw new Error("category not found");

      const form = formRepo.create({ category });
      await formRepo.save(form);

      async function createAttribute(
        attrInput: FormAttributeInput,
        form: Form,
        parent?: FormAttribute,
      ): Promise<FormAttribute> {
        // Map input type string to enum, fallback to FIELD if unknown
        const typeEnum =
          AttributeType[
          attrInput.type.toUpperCase() as keyof typeof AttributeType
          ] || AttributeType.FIELD;

        // Create attribute entity
        const attr = attrRepo.create({
          name: attrInput.name,
          label: attrInput.label,
          type: typeEnum,
          placeholder: attrInput.placeholder,
          required: attrInput.required,
          multiple: attrInput.multiple ?? false,
          options: attrInput.options,
          form,
          parent,
        });

        await attrRepo.save(attr);

        // Recursively create and attach children if any
        if (attrInput.children && attrInput.children.length > 0) {
          const childrenEntities: FormAttribute[] = [];
          for (const childInput of attrInput.children) {
            const child = await createAttribute(childInput, form, attr);
            childrenEntities.push(child);
          }
          attr.children = childrenEntities;
        }

        return attr;
      }

      const attributes: FormAttribute[] = [];
      for (const attrInput of input.attributes) {
        const attribute = await createAttribute(attrInput, form);
        attributes.push(attribute);
      }

      form.attributes = attributes;

      return form;
    },
    submitForm: async (
      _: any,
      { input }: { input: SubmitFormInput },
      context: any,
    ) => {
      const formRepo = dataSource.getRepository(Form);
      const submissionRepo = dataSource.getRepository(FormSubmission);
      const ctxUser = await authenticate(context);
      const form = await formRepo.findOne({ where: { id: input.formId } });
      if (!form) throw new Error("Form not found");

      const category = await categoryRepo.findOne({
        where: { id: input.categoryId },
      });
      if (!category) throw new Error("Category not found");

      const submission = submissionRepo.create({
        form,
        answers: input.answers,
        category,
        createdBy: ctxUser.userId,
      });

      const sumittedForm = await submissionRepo.save(submission);

      if (input.documents && input.documents.length > 0) {
        input.documents.forEach((doc) => {
          if (!doc.fileName || !doc.filePath) {
            throw new Error("Document must have fileName and filePath");
          }
          documentRepo.create({
            title: doc.title,
            fileName: doc.fileName,
            fileType: doc.fileType,
            filePath: doc.filePath,
            description: doc.description || "",
            formSubmission: sumittedForm,
          });
        });
      }
      // add notification
      const user = await userRepository.findOne({
        where: { id: ctxUser.userId },
      });
      if (!user) throw new Error("User not found");
      const notification = notificationRepository.create({
        name: "Form Submission",
        message: "Your form has been submitted successfully",
        user: user,
      });
      const saveNotification = await notificationRepository.save(notification);
      // Publish to subscription
      await pubsub.publish("NEW_NOTIFICATION", {
        newNotification: saveNotification,
      });

      return submission;
    },
    updateApplication: async (
      _: any,
      { applicationId }: { applicationId: string },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) {
        throw new Error("Unauthorized access");
      }

      const submission = await submissionRepo.findOne({
        where: { id: applicationId },
      });
      if (!submission) throw new Error("Application not found");
      const user = await userRepository.findOne({
        where: { id: submission.createdBy },
      });
      if (!user) throw new Error("User not found");
      submission.status = FormStatus.COMPLETED;
      submission.updatedBy = ctxUser.userId;
      // add notification to user
      const notification = notificationRepository.create({
        name: "Applicatioin Status",
        message: "Your application has been updated",
        user: user,
      });

      const saveNotification = await notificationRepository.save(notification);
      // Publish to subscription
      await pubsub.publish("NEW_NOTIFICATION", {
        newNotification: saveNotification,
      });
      if (user.fcmToken) {
        await sendNotification(
          user.fcmToken,
          "Application Status Updated",
          "Your application has been marked as completed.",
        );
      } else {
        console.warn(`User with id ${user.id} does not have an FCM token.`);
      }

      return await submissionRepo.save(submission);
    },
    updateFormSubmissionStatus: async (
      _: any,
      {
        id,
        status,
        paymentId,
        reasonForReturn,
        reasonForRejection,
      }: {
        id: string;
        status: FormStatus;
        paymentId: string;
        reasonForRejection: string;
        reasonForReturn: string;
      },
      context: any,
    ) => {
      const ctxUser = await authenticate(context);
      if (!ctxUser) {
        throw new Error("Unauthorized access");
      }
      logger.info("Submission id.....", id);
      const submission = await submissionRepo.findOne({
        where: { id },
      });
      if (!submission) throw new Error("Submission not found");
      logger.info("Submission found", submission);
      submission.status = status;
      if (paymentId) {
        submission.paymentId = paymentId;
        submission.updatedBy = ctxUser.userId;
      }
      if (status) {
        submission.status = status;
        submission.updatedBy = ctxUser.userId;
      }
      if (reasonForReturn) {
        submission.reasonForReturn = reasonForReturn;
        submission.updatedBy = ctxUser.userId;
      }

      if (reasonForRejection) {
        submission.reasonForRejection = reasonForRejection;
        submission.updatedBy = ctxUser.userId;
      }

      //add notification
      const user = await userRepository.findOne({
        where: { id: submission.createdBy },
      });
      if (!user) throw new Error("User not found");
      const notification = notificationRepository.create({
        name: "Application Status",
        message: `Your application status has been updated to ${status}`,
        user: user,
      });
      const saveNotification = await notificationRepository.save(notification);
      // Publish to subscription
      await pubsub.publish("NEW_NOTIFICATION", {
        newNotification: saveNotification,
      });

      return await submissionRepo.save(submission);
    },
  },
  Subscription: {
    newNotification: {
      subscribe: (_: any, __: any, context: any) => {
        return pubsub.asyncIterableIterator("NEW_NOTIFICATION");
      },
    },
  },
};

export default serviceResolvers;
