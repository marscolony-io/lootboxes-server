import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use((req: express.Request, res: express.Response, next: Function) => {
  if (!req.url.endsWith('.png') && req.url !== '/metrics') {
    console.log('ACCESS LOG', req.url);
  }
  next();
});

const getTokenData = (token: string, rarityStr: string) => {
  const tokenNumber = parseInt(token);
  const rarity = parseInt(rarityStr);
  const rarityText = ['Common', 'Rare', 'Legendary'][rarity] ?? '0';
  const color = [
    'orange-top',
    'yellow-top',
    'red-top',
    'dark-orange',
    'dark-yellow',
    'dark-red',
    'basic-orange',
    'basic-yellow',
    'basic-red',
  ][tokenNumber % 9];
  return {
    tokenNumber,
    rarity,
    rarityText,
    color,
  };
};

// image for a token
app.get('/:token/:rarityStr.png', (req: express.Request, res: express.Response) => {
  const { token, rarityStr } = req.params;
  const { tokenNumber, rarity, rarityText, color } = getTokenData(token, rarityStr);
  if (
    Number.isNaN(tokenNumber)
    || Number.isNaN(rarity)
    || ![0, 1, 2].includes(rarity)
  ) {
    res.status(404).end();
    return;
  }
  const filePath = path.join(__dirname, '../public/images', `${rarityText}-${color}.png`);
  
  const s = fs.createReadStream(filePath);
  s.on('open', () => {
    res.set('Content-Type', 'image/png');
    s.pipe(res);
  });
  s.on('error', () => {
    res.set('Content-Type', 'text/plain');
    res.status(404).end('Not found');
  });
});

const attribute = (trait_type: string, value: string): { trait_type: string; value: string; } => {
  return {
    trait_type,
    value,
  };
};

// metadata
app.get('/:token/:rarityStr', (req: express.Request, res: express.Response) => {
  const { token, rarityStr } = req.params;
  const { tokenNumber, rarity, rarityText, color } = getTokenData(token, rarityStr);
  if (
    Number.isNaN(tokenNumber)
    || Number.isNaN(rarity)
    || ![0, 1, 2].includes(rarity)
  ) {
    res.status(404).end();
    return;
  }
  res.json({
    name: `${rarityText} Utility Crate`,
    description: `Sealed ${rarityText} Utility Crate gen0 made by marscolony.io`,
    image: (process.env.SERVER ?? 'https://lootboxes-harmony.marscolony.io') + `/${token}/${rarityStr}.png`,
    attributes: [
      attribute('Color', color.split('-').join(' ')),
      attribute('Rarity', rarityText),
    ]
  });
});

app.use((req: express.Request, res: express.Response, next: Function) => {
  res.status(404).end();
});

app.listen(parseInt(process.env.PORT ?? '8700'), '127.0.0.1', () => {
  console.log('server started', process.env.PORT ?? '8700');
});