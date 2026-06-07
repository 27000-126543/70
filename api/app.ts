import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import simulationRoutes from './routes/simulations.js'
import exportRoutes from './routes/exports.js'
import observationRoutes from './routes/observations.js'
import { scheduler } from './services/scheduler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/simulations', simulationRoutes)
app.use('/api/exports', exportRoutes)
app.use('/api/observations', observationRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'GRMHD Simulation Backend OK',
      scheduler: scheduler ? 'running' : 'stopped',
      timestamp: Date.now(),
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API] Unhandled error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found: ' + req.method + ' ' + req.path,
  })
})

export default app
