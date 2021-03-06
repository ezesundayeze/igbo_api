import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import swaggerUI from 'swagger-ui-express';
import sslRedirect from 'heroku-ssl-redirect';
import { editorRouter, router, testRouter } from './routers';
import logger from './middleware/logger';
import { PORT, MONGO_URI, SWAGGER_DOCS } from './config';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('🗄 Database is connected');
});

if (process.env.NODE_ENV === 'production') {
  // enable ssl redirect
  app.use(sslRedirect());
}

app.use(cors({
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));

app.use(express.static('./build/dist'));
app.get('/', (_, res) => {
  res.send(path.resolve(__dirname, '/build/dist/index.html'));
});

app.use('*', logger);

app.use('/docs', swaggerUI.serve, swaggerUI.setup(SWAGGER_DOCS));

/* Grabs data from MongoDB */
app.use('/api/v1', router);

// TODO: remove this guard rail when releasing for production
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1', editorRouter);
}

/* Grabs data from JSON dictionary */
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1/test', testRouter);
}

const server = app.listen(PORT, () => {
  console.log(`🟢 Server started on port ${PORT}`);

  /* Used to test server build */
  if (process.env.NODE_ENV === 'build') {
    console.log('🧪 Testing server build');
    setTimeout(() => {
      console.log('✅ Build test passed');
      process.exit(0);
    }, 5000);
  }
});

app.get('*', (_, res) => {
  res
    .status(404)
    .sendFile(path.resolve(__dirname, 'dist/404.html'));
});

server.clearDatabase = () => {
  mongoose.connection.db.dropDatabase();
};

export default server;
