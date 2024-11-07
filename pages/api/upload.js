import multiparty from 'multiparty';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import mime from 'mime-types';
import { isAdminRequest } from "./auth/[...nextauth]";
import { mongooseConnect } from '../../lib/mongoose';



if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_CONFIG)),
    storageBucket: process.env.STORAGE_BUCKET,
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
    

    await bucket.upload(file.path, {
      destination: `images/${newFilename}`,
      metadata: {
        contentType: mime.lookup(file.path)
      },
    });

    const link = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/images%2F${newFilename}?alt=media`;
    links.push(link);
  }

  return res.json({ links });
}

export const config = {
  api: { bodyParser: false },
};