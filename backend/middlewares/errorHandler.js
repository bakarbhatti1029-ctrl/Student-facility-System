// Custom error handling middleware
const errorHandler = (err, req, res, next) => {
    // Set the status code to 500 if it's not already set
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode);

    // Send a JSON response with the error details
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = errorHandler;
