const responseModel = (status, message, data = null) => {
    return {
        status,
        message,
        ...(data !== null && { data })
    };
};

export default responseModel;