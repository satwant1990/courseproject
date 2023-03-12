export const catchAsyncError = (passedFun) => (req, resp, next) => {
    Promise.resolve(passedFun(req, resp, next)).catch(next)
}