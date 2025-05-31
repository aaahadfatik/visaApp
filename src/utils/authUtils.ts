import { dataSource } from '../datasource'; 
import { User } from '../entity';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '30d';
const REFRESH_THRESHOLD = 10 * 60 * 1000; 

export const authenticate = async (context: any) => {
  try {
    const userRepository = dataSource.getRepository(User);
    // Fetch the user along with their roles
    const user = await userRepository.findOne({
      where: { id: context?.userId },
      relations: ['role'], // Include the roles in the query
    });

    if (!user?.refreshToken) {
      throw new Error('Session expired. Please log in again.');
    }

    return {
      userId:user.id,
      roles: user.role, 
    };
    
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
};
export const authorize = (requiredPermissions: { [key: string]: boolean }) => {
  try {

    return (resolve: any) => async (parent: any, args: any, context: any, info: any) => {
      const { role } = context;
  
      // Check if each required permission is true
      for (const [permission, required] of Object.entries(requiredPermissions)) {
        if (required && (!role || !role[permission])) {
          throw new Error(`You do not have permission to perform this action: ${permission}.`);
        }
      }
  
      return resolve(parent, args, context, info); // Call the next resolver
    };
  } catch (err) {
    throw new Error('Authorization failed');
  }
};

export const generateTokens = (user: User) => {
  const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = async (token: string) => {
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, exp?: number };
      const now = Math.floor(Date.now() / 1000); 

      if (decoded.exp && decoded.exp - now < REFRESH_THRESHOLD / 1000) {
          const userRepository = dataSource.getRepository(User);
          const user = await userRepository.findOne({ where: { id: decoded.userId } });

          if (!user || !user.refreshToken) {
              throw new Error('Invalid refresh token');
          }

          // Generate a new token
          const { accessToken, refreshToken } = generateTokens(user);
          user.refreshToken = refreshToken;
          await userRepository.save(user);

          return { newToken: accessToken, user };
      }

      return { userId: decoded.userId };
  } catch (error) {
      throw new Error('Token is invalid or expired');
  }
};
