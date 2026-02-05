class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error for debugging
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', err);
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        // Mongoose validation error
        const messages = Object.values(err.errors).map(e => e.message);
        err.message = messages.join('. ');
        err.statusCode = 400;
    }

    if (err.code === 11000) {
        // MongoDB duplicate key error
        const field = Object.keys(err.keyValue)[0];
        err.message = `${field} já existe.`;
        err.statusCode = 400;
    }

    if (err.name === 'JsonWebTokenError') {
        err.message = 'Token inválido.';
        err.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        err.message = 'Token expirado.';
        err.statusCode = 401;
    }

    // Send response
    if (req.originalUrl.startsWith('/api')) {
        // API error response
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        });
    }

    // Rendered error page
    res.status(err.statusCode).render('error', {
        pageTitle: 'Erro',
        message: err.message,
        statusCode: err.statusCode
    });
};

module.exports = errorHandler;
module.exports.AppError = AppError;
