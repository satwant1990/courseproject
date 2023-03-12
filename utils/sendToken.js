export const sendToken = (resp, user, message, statusCode = 200) => {

    const token = user.getJwtToken()
    const options = {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    resp.status(statusCode).cookie('token', token, options).json({
        success: true,
        message: message,
        user
    })
}