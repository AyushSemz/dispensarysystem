import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication invalid: No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = { userId: decoded.userId, role: decoded.role };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Authentication invalid: Token is not valid.' });
    }
};

export default authMiddleware;

export const isDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'DOCTOR') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }
};

export const isPatient = (req, res, next) => {
    if (req.user && req.user.role === 'PATIENT') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Patient role required.' });
    }
};