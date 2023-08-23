import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import * as db from './db.js';
import { BusinessLogicError } from './business-logic-error.js';

export const app = express();

// config

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      connectSrc: ["'self'", 'ws://127.0.0.1:35729/livereload'],
      imgSrc: '*',
    },
  },
}));

app.use(cors());

app.use(express.static(path.join(process.cwd(), 'src', 'public')));

// views

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.get('/', async (req, res) => {
  res.render('pages/home');
});

app.get('/presentes', async (req, res) => {
  res.render('pages/gift-list');
});

app.get('/detalhes', async (req, res) => {
  res.render('pages/details');
});

app.use(async (err, req, res, next) => {
  res.status(
    err instanceof BusinessLogicError ? 400 : 500
  );
  res.send(`Alguma coisa deu errado :( - manda pro Matheus um print: ${err}`);
});

// api

app.get('/api/gifts', async (req, res) => {
  const gifts = await db.getAllGifts();
  res.json({
    gifts: gifts.sort((a, b) => (a.description < b.description) ? -1 : 1)
  });
});

app.post('/api/gifts/choose/:id', async (req, res) => {
  await db.chooseGift(req.params.id);
});

app.get('/api/new-id', async (req, res) => {
  const id = db.generateId();
  res.json({ id });
});

app.use(async (err, req, res, next) => {
  if (err instanceof BusinessLogicError) {
    res.status(400);
  } else {
    res.status(500);
    console.log(err);
  }
  res.json({ error: { message: err.message, code: err.code } });
});