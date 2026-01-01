export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      req.user = payload;
    } else {
      req.user = { uid: 'unknown' };
    }
    next();
  } catch {
    return res.status(403).json({ message: 'Forbidden: Invalid token format' });
  }
};

