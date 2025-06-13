import { Role, User,Document } from '../../entity';
import { dataSource } from '../../datasource';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../utils/authUtils';
import { CreateRoleInput, CreateUserInput, UpdateRoleInput, UpdateUserInput } from '../../types';

const roleRepository = dataSource.getRepository(Role);
const userRepository = dataSource.getRepository(User);
const documentRepository = dataSource.getRepository(Document);

const userResolvers = {
  Query: {
    getRoles: async(_:any)=>{
        const userRoles = await roleRepository.find();
        return userRoles
    },
    getUser: async (_: any, { id }: { id: string },context: any) => {
        // const authUser = await authenticate(context);
        // if (!authUser) {
        //     throw new ApolloError('Unauthorized access', 'UNAUTHORIZED');
        // }
        return await userRepository.findOne({
          where: { id },
          relations: ['applications','documents','notifications'],
        });
    },
    getUsers: async (_: any, { limit, offset }: { limit: number; offset: number },context: any) => {
      const users = await userRepository.find({
        take: limit ,
        skip: offset,
        order:{createdAt:'DESC'},
        // relations: ['applications','documents'],
      });
      if (!users) throw new Error('Users not found');
      return users;
    },
  },
  Mutation: {
    createRole:  async (_:any,{input}:{input:CreateRoleInput})=>{
      try{
        const newRole = roleRepository.create({
          ...input,
        })
        await roleRepository.save(newRole);
        return newRole
      }catch(error){
        throw new Error('Error on creating role');
      }
    },
    updateRole:  async (_:any,{input}:{input:UpdateRoleInput})=>{
      try{
        const role = await roleRepository.findOne({ where: { id: input.id } });
        if (!role) throw new Error('Role not found');

        Object.assign(role, input);
        await roleRepository.save(role);
        return role;
      }catch(error){
        throw new Error('Error on creating role');
      }
    },
    login: async (_: any, input: {email:string, password: string }) => {
      const { password, email } = input;
    
      const user = await userRepository.findOne({
        where: { email },
        relations:['role']
      });
    
      if (!user) throw new Error('User not found');
      if (!password) throw new Error('Password is required');

      // Validate password
      const validPassword = await bcrypt.compare(password, user.password);
    
      if (!validPassword)  throw new Error('Invalid password');
    
      // Generate JWT tokens
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '30d' }
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
          ClockedInAt: new Date()
        },
      };
    },
    logout: async (_: any, __: any, context: any) => {
      try {
        const decoded = authenticate(context);
        if (!decoded) throw new Error('Unauthorized');

        const user = await userRepository.findOne({ where: { id: (await decoded).userId } });
        if (!user) throw new Error('User not found');

        user.refreshToken = "";
        await userRepository.save(user);

        return {
          message: "Logout successful"
        };
    
      } catch (error:any) {
        console.error('Logout error:', error);
        throw new Error(error.message);
      }
    },      
    createUser:  async (_: any, { input }: { input: CreateUserInput }, context: any) => {
      try{
          // const usercxt = await authenticate(context);
          // const userRole = await roleRepository.findOne({ where: { id: input.roleId } });
          const saltRounds = 10;

          // Check if the user already exists
          const existingUser = await userRepository.findOne({ where: { email: input.email } });
          if (existingUser) throw new Error('User already exists');

          // if (!userRole) {
          //   throw new Error('Specified role does not exist');
          // }

          // Hash the password
          const hashedPassword = await bcrypt.hash(input.password, saltRounds);
          const { password, ...userData } = input;
          if (input.picture) input.picture = await processFile(input.picture) || input.picture;

          // Create the new user
          const newUser = userRepository.create({
            ...userData,
            picture: input.picture,
            // role: userRole,
            password: hashedPassword,
            createdAt:new Date()
          });


          // Save the user in the database
          const savedUser = await userRepository.save(newUser);

          // Process vehicle pictures array
          if (input.documents && input.documents.length > 0) {
            await Promise.all(input.documents.map(async (pic) => {
              const uploaded = await processFile(pic.filePath);
              if (uploaded) {
                const newDoc = documentRepository.create({
                  ...pic,
                  filePath: uploaded,
                  createdBy: savedUser.id,
                  createdAt: new Date()
                });
                await documentRepository.save(newDoc);
              }
            }));
          }

          // Return the newly created user (excluding the password)
          return {
           ...newUser,
        };
      }catch(error){
        throw Error(`Error on create User${error}`)
      }
    },
    updateUser:  async (_: any, { input }: { input: UpdateUserInput }, context: any) => {
      try{
        // Fetch the existing user
        const existingUser = await userRepository.findOne({ where: { id: input.id } });
        if (!existingUser) throw new Error('User not found');
      
        // Check if the email is being updated and is unique
        if (input.email && input.email !== existingUser.email) {
          const userWithEmail = await userRepository.findOne({ where: { email: input.email } });
          if (userWithEmail) throw new Error('Email already in use by another user');
        }
      
        // Fetch the new role if provided
        let userRole = undefined;
        if (input.roleId) {
          userRole = await roleRepository.findOne({ where: { id: input.roleId } });
          if (!userRole) {
            throw new Error('Specified role does not exist');
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
      }catch(error){
        throw Error("error on updating User")
      }
    },
    refreshToken: async (_: any, { token }: { token: string }) => {
      if (!token) throw new Error('No token provided');
      try {
        // Verify refresh token
        const decoded: any = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });
    
        if (!user || user.refreshToken !== token)  throw new Error('Invalid refresh token');
    
        // Generate a new access token
        const accessToken = jwt.sign({ userId: user.id, Email: user.email }, process.env.JWT_SECRET!, { expiresIn: '10m' });
    
        return { accessToken };
      } catch (error) {
        throw new Error('Invalid or expired refresh token');
      }
    },
  }
};

export default userResolvers;

export const processFile = async (base64: string): Promise<string | null> => {
  const fs = require('fs').promises;
  const path = require('path');

  if (!base64 || typeof base64 !== 'string') {
    console.warn('Invalid file input:', base64);
    return null;
  }

  const match = base64.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    console.warn('Base64 format is incorrect:', base64.substring(0, 30));
    return null;
  }

  const mimeType = match[1];
  const base64Data = match[2];

  let fileExtension = '';
  let folder = '';
  let mimePrefix = '';

  if (mimeType.startsWith('image/')) {
    fileExtension = mimeType.split('/')[1] || 'jpg';
    folder = '/var/www/visaApp/public/static';
    mimePrefix = 'static';
  } else if (mimeType === 'application/pdf') {
    fileExtension = 'pdf';
    folder = '/var/www/visaApp/public/docs';
    mimePrefix = 'docs';
  } else {
    console.warn('Unsupported MIME type:', mimeType);
    return null;
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
  const filePath = path.join(folder, filename);

  try {
    await fs.writeFile(filePath, buffer);
    const publicUrl = `https://visaapp.duckdns.org/${mimePrefix}/${filename}`;
    console.log('File saved:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error writing file:', error);
    return null;
  }
};