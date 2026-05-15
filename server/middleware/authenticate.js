import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/http.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      return sendError(res, 401, 'Authentication required');
    }
    const decoded = verifyToken(token);
    const userId = decoded.sub || decoded.userId;
    if (!userId) {
      return sendError(res, 401, 'Invalid token payload');
    }
    const user = await User.findById(userId).select('_id name email role');
    if (!user) {
      return sendError(res, 401, 'User no longer exists');
    }
    req.user = user;
    next();
  } catch {
    return sendError(res, 401, 'Invalid or expired token');
  }
}
