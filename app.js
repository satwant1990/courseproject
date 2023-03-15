import express from 'express'
const app = express()
import errorMiddleware from './middlewares/error.js'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'

dotenv.config({ path: "./config/config.env" })
app.use(cors({
	credentials: true,
    origin: "http://localhost:3000",
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}))
//config database
import connectDatabse from './config/database.js'
connectDatabse()

//middlewares
app.use(express.json())

app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())



//Routes
import courseRoutes from './routes/courseRoutes.js'
import userRoutes from './routes/userRoutes.js'
import paymentRoutes from './routes/paymentRoute.js'
import extraRoutes from './routes/extraRoutes.js'

app.use('/api/v1', courseRoutes)
app.use('/api/v1', userRoutes)
app.use('/api/v1', paymentRoutes)
app.use('/api/v1', extraRoutes)

app.get('/', (req, resp, next) => {
    resp.send("Welcome to Online Course Project ")
})




export default app;

app.use(errorMiddleware)