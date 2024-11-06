import multiparty from 'multiparty';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import mime from 'mime-types';
import { isAdminRequest } from "./auth/[...nextauth]";
import serviceAccount from '';
import { mongooseConnect } from '../../lib/mongoose';


// Инициализация Firebase, если приложение еще не инициализировано
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: '',
  });
}


const bucket = getStorage().bucket();

export default async function handle(req, res) {
  await mongooseConnect();
  await isAdminRequest(req, res);

  const form = new multiparty.Form();
  const { fields, files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });

  console.log('length:', files.file.length);
  const links = [];

  for (const file of files.file) {
    const ext = file.originalFilename.split('.').pop();
    const newFilename = Date.now() + '.' + ext;
    console.log({ext, file});
    

    // Загрузка файла в Firebase Cloud Storage
    await bucket.upload(file.path, {
      destination: `images/${newFilename}`,
      metadata: {
        contentType: mime.lookup(file.path)
      },
    });

    // Получение ссылки на загруженный файл
    const link = ``;
    links.push(link);
  }

  return res.json({ links });
}

export const config = {
  api: { bodyParser: false },
};