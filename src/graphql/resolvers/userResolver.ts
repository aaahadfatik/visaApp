import { Role, User, Document, FormSubmission } from "../../entity";
import { dataSource } from "../../datasource";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticate } from "../../utils/authUtils";
import {
  CreateRoleInput,
  CreateUserInput,
  UpdateRoleInput,
  UpdateUserInput,
  UserFilter,
} from "../../types";
import { FormStatus } from "../../enum";
import { Between, ILike } from "typeorm";
import crypto from "crypto";
import { sendEmail } from "../../service/emailService";
import { baseEmailTemplate } from "../../utils/emailTemplates";


const roleRepository = dataSource.getRepository(Role);
const userRepository = dataSource.getRepository(User);
const documentRepository = dataSource.getRepository(Document);
const submittedFomrRepository = dataSource.getRepository(FormSubmission);
const otpRepository = dataSource.getRepository("OTP");

const userResolvers = {
  Query: {
    getRoles: async (_: any) => {
      const userRoles = await roleRepository.find();
      return userRoles;
    },
    getUser: async (_: any, { id }: { id: string }, context: any) => {
      // const authUser = await authenticate(context);
      // if (!authUser) {
      //     throw new ApolloError('Unauthorized access', 'UNAUTHORIZED');
      // }
      return await userRepository.findOne({
        where: { id },
        relations: ["documents", "notifications", "applications"],
      });
    },
    getUsers: async (
      _: any,
      {
        limit,
        offset,
        filter,
      }: { limit: number; offset: number; filter: UserFilter },
      context: any
    ) => {
      let whereClause: any = {};
      if (filter) {
        if (filter.status !== undefined) {
          whereClause.isActive = filter.status;
        }
        if (filter.type !== undefined) {
          whereClause.isCompany = filter.type;
        }
        if (filter.search) {
          whereClause.name = ILike(`%${filter.search}%`);
        }
      }
      const [users, total] = await userRepository.findAndCount({
        where: whereClause,
        take: limit,
        skip: offset,
        order: { createdAt: "DESC" },
        relations: ["documents", "notifications", "applications"],
      });
      if (!users) throw new Error("Users not found");
      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          const submittedFromCount = await submittedFomrRepository.count({
            where: { createdBy: user.id },
          });

          return {
            ...user,
            submittedFromCount,
          };
        })
      );

      return { users: usersWithCounts, total };
    },
    getUserTypesCount: async (_: any, __: any, context: any) => {
      const companyCount = await userRepository.count({
        where: { isCompany: true },
      });
      const individualCount = await userRepository.count({
        where: { isCompany: false },
      });
      return { companyCount, individualCount };
    },

    getDashboardStatistics: async (_: any, __: any) => {
      const totalUsers = await userRepository.count();
      const applicationsSubmitted = await submittedFomrRepository.count();
      const pendingApplications = await submittedFomrRepository.count({
        where: { status: FormStatus.UNDER_PROGRESS },
      });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayApplications = await submittedFomrRepository.count({
        where: {
          createdAt: Between(today, tomorrow),
        },
      });
      return {
        totalUsers,
        applicationsSubmitted,
        pendingApplications,
        todayApplications,
      };
    },
    getRegisteredUsersGraph: async (_: any, { year }: { year?: string }) => {
      const userRepo = dataSource.getRepository(User);
      const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
      const data: { companyCount: number; individualCount: number }[] = [];
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(currentYear, month, 1);
        const endDate = new Date(currentYear, month + 1, 1);
        const companyCount = await userRepo.count({
          where: {
            isCompany: true,
            createdAt: Between(startDate, endDate),
          },
        });
        const individualCount = await userRepo.count({
          where: {
            isCompany: false,
            createdAt: Between(startDate, endDate),
          },
        });
        data.push({ companyCount, individualCount });
      }
      return { year: currentYear.toString(), data };
    },
  },
  Mutation: {
    createRole: async (_: any, { input }: { input: CreateRoleInput }) => {
      try {
        const newRole = roleRepository.create({
          ...input,
        });
        await roleRepository.save(newRole);
        return newRole;
      } catch (error) {
        throw new Error("Error on creating role");
      }
    },
    updateRole: async (_: any, { input }: { input: UpdateRoleInput }) => {
      try {
        const role = await roleRepository.findOne({ where: { id: input.id } });
        if (!role) throw new Error("Role not found");

        Object.assign(role, input);
        await roleRepository.save(role);
        return role;
      } catch (error) {
        throw new Error("Error on creating role");
      }
    },
    login: async (_: any, input: { email: string; password: string }) => {
      const { password, email } = input;

      const user = await userRepository.findOne({
        where: { email },
        relations: ["role"],
      });

      if (!user) throw new Error("User not found");
      if (!password) throw new Error("Password is required");

      // Validate password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) throw new Error("Invalid password");

      // Generate JWT tokens
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
      );
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "30d" }
      );

      // Update the user with the new refresh token
      user.refreshToken = token; // Ensure refreshToken is defined in User entity
      await userRepository.save(user);
      // Return the tokens and user details
      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: Role.name,
          ClockedInAt: new Date(),
        },
      };
    },
    logout: async (_: any, __: any, context: any) => {
      try {
        const decoded = authenticate(context);
        if (!decoded) throw new Error("Unauthorized");

        const user = await userRepository.findOne({
          where: { id: (await decoded).userId },
        });
        if (!user) throw new Error("User not found");

        user.refreshToken = "";
        await userRepository.save(user);

        return {
          message: "Logout successful",
        };
      } catch (error: any) {
        console.error("Logout error:", error);
        throw new Error(error.message);
      }
    },
    createUser: async (
      _: any,
      { input }: { input: CreateUserInput },
      context: any
    ) => {
      try {
        // const usercxt = await authenticate(context);
        // const userRole = await roleRepository.findOne({ where: { id: input.roleId } });
        const saltRounds = 10;

        // Check if the user already exists
        const existingUser = await userRepository.findOne({
          where: { email: input.email },
        });
        if (existingUser) throw new Error("User already exists");

        // if (!userRole) {
        //   throw new Error('Specified role does not exist');
        // }

        // Hash the password
        const hashedPassword = await bcrypt.hash(input.password, saltRounds);
        const { password, ...userData } = input;
        if (input.picture) input.picture;

        // Create the new user
        const newUser = userRepository.create({
          ...userData,
          picture: input.picture,
          // role: userRole,
          password: hashedPassword,
          createdAt: new Date(),
        });

        // Save the user in the database
        const savedUser = await userRepository.save(newUser);

        // Process vehicle pictures array
        if (input.documents && input.documents.length > 0) {
          await Promise.all(
            input.documents.map(async (pic) => {
              const newDoc = documentRepository.create({
                ...pic,
                user: savedUser, // ✅ connect to the user properly
              });
              await documentRepository.save(newDoc);
            })
          );
        }

        // Return the newly created user (excluding the password)
        return {
          ...newUser,
        };
      } catch (error) {
        throw Error(`Error on create User${error}`);
      }
    },
    updateUser: async (
      _: any,
      { input }: { input: UpdateUserInput },
      context: any
    ) => {
      try {
        // Fetch the existing user
        const existingUser = await userRepository.findOne({
          where: { id: input.id },
        });
        if (!existingUser) throw new Error("User not found");

        // Check if the email is being updated and is unique
        if (input.email && input.email !== existingUser.email) {
          const userWithEmail = await userRepository.findOne({
            where: { email: input.email },
          });
          if (userWithEmail)
            throw new Error("Email already in use by another user");
        }

        // Fetch the new role if provided
        let userRole = undefined;
        if (input.roleId) {
          userRole = await roleRepository.findOne({
            where: { id: input.roleId },
          });
          if (!userRole) {
            throw new Error("Specified role does not exist");
          }
        }

        // Update the user data, excluding the password if not updated
        const updatedUser = {
          ...existingUser,
          ...input,
          role: userRole || existingUser.role, // Only update role if new one is provided
        };

        // Save the updated user in the database
        await userRepository.save(updatedUser);

        // Return the updated user (excluding the password)
        return {
          ...updatedUser,
          password: undefined, // Exclude password from the returned object
        };
      } catch (error) {
        throw Error(`error on updating User ${error}`);
      }
    },
    deleteUser: async (_: any, { id }: { id: string }, context: any) => {
      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        throw new Error("User not found");
      }
      user.isDeleted = true;
      await userRepository.save(user);
      return true;
    },
    changePassword: async (
      _: any,
      {
        oldPassword,
        newPassword,
      }: { oldPassword: string; newPassword: string },
      context: any
    ) => {
      const authUser = await authenticate(context);
      const user = await userRepository.findOne({
        where: { id: authUser.userId },
      });
      if (!user) throw new Error("User not found");

      // Validate old password
      const validPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validPassword) throw new Error("Old password is incorrect");

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user's password
      user.password = hashedNewPassword;
      await userRepository.save(user);

      return true;
    },
    refreshToken: async (_: any, { token }: { token: string }) => {
      if (!token) throw new Error("No token provided");
      try {
        // Verify refresh token
        const decoded: any = jwt.verify(
          token,
          process.env.REFRESH_TOKEN_SECRET!
        );
        const user = await userRepository.findOne({
          where: { id: decoded.userId },
        });

        if (!user || user.refreshToken !== token)
          throw new Error("Invalid refresh token");

        // Generate a new access token
        const accessToken = jwt.sign(
          { userId: user.id, Email: user.email },
          process.env.JWT_SECRET!,
          { expiresIn: "10m" }
        );

        return { accessToken };
      } catch (error) {
        throw new Error("Invalid or expired refresh token");
      }
    },
    verifyEmail: async ( _: any, { email }: { email: string }): Promise<string> => {
      try {
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const user = await userRepository.findOne({
          where: { email: normalizedEmail, isDeleted: false },
        });

        if (user) {
          return "An account with that email exists";
        }
        const generateOTP = () =>
          Math.floor(100000 + Math.random() * 900000).toString();

        await otpRepository.delete({ email: normalizedEmail });

        // Generate OTP
        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        // Expiry (5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Save OTP
        const otpEntity = otpRepository.create({
          email: normalizedEmail,
          otpHash,
          expiresAt,
        });

        await otpRepository.save(otpEntity);

        await sendEmail({
          to: normalizedEmail,
          subject: "OTP Verification",
          html: baseEmailTemplate({
            title: " ",
            message: `
              <p>Dear User,</p>
              
              <p>To continue with your request, please use the following One-Time Password (OTP):</p>
              
              <h2 style="color:#111827; margin:20px 0;">${otp}</h2>
              
              <p>This code is valid for a limited time and is required to complete the verification process.</p>
              
              <p>If you did not request this action, please disregard this message.</p>
              
              <p style="margin-top:24px;">
                Kind regards,<br />
                <strong>Jusoor Team</strong>
              </p>
            `,
          }),
        });

        return "OTP has been sent to your email address.";
      } catch (error: any) {
        throw new Error(error.message || "Failed to verify OTP");
      }
    },
    verifyEmailOTP: async ( _: any,{ email, otp }: { email: string; otp: string }): Promise<{ success: boolean; message: string; resetToken?: string }> => {
      try {
        const normalizedEmail = email.trim().toLowerCase();

        // Get latest unused OTP
        const otpRecord = await otpRepository.findOne({
          where: { email: normalizedEmail, isUsed: false },
          order: { createdAt: "DESC" },
        });

        if (!otpRecord) {
          return {
            success: false,
            message: "OTP not found or already used.",
          };
        }

        if (otpRecord.expiresAt < new Date()) {
          return {
            success: false,
            message: "OTP has expired.",
          };
        }
        const hashedOtp = hashOTP(otp);

        if (hashedOtp !== otpRecord.otpHash) {
          return {
            success: false,
            message: "Invalid OTP.",
          };
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRepository.save(otpRecord);

        await otpRepository.delete({
          isUsed: true,
        });
        return {
          success: true,
          message: "OTP verified successfully.",
          // resetToken,
        };
      } catch (error: any) {
        throw new Error(error.message || "Failed to verify OTP");
      }
    },
  },
};

export default userResolvers;

export const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const hashOTP = (otp: string): string =>
  crypto.createHash("sha256").update(otp).digest("hex");
