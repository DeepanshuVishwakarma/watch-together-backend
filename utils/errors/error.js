class AppError extends Error {
    constructor(message , statusCode){
        super(message);
        this.explnation = message;
        this.statusCode = statusCode;
    }
}
module.exports = AppError;