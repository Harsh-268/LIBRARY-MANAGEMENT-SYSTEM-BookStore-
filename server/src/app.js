import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();
app.use(cors({ origin:process.env.CORS_ORIGIN|| "http://localhost:5173", credentials: true }));
app.use(express.json({limit:"1mb"}))
app.use(express.urlencoded({ extended: true,limit:"16kb" }))
app.use(cookieParser());

app.set('trust proxy', 2); 


//importing routes
import userRoute from './routes/user.routes.js';
import bookRoute from './routes/book.routes.js';
import issueRoute from './routes/issue.routes.js';
import dashboardRoute from './routes/dashboard.routes.js';
import contactRoute from './routes/contact.routes.js';
// Mounting routes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    
    next(); 
});
app.use('/api/v1/users', userRoute);
app.use('/api/v1/books', bookRoute);
app.use('/api/v1/issues', issueRoute);
app.use('/api/v1/dashboard', dashboardRoute);
app.use('/api/v1/contact', contactRoute);
export default app;