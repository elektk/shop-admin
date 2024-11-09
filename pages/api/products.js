import {Product} from "@/models/Product";
import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_CONFIG)),
    storageBucket: process.env.STORAGE_BUCKET,
  });
}

const bucket = getStorage().bucket();

export default async function handle(req, res) {
  const {method} = req;
  await mongooseConnect();
  await isAdminRequest(req,res);

  if (method === 'GET') {
    if (req.query?.id) {
      res.json(await Product.findOne({_id:req.query.id}));
    } else {
      res.json(await Product.find());
    }
  }

  if (method === 'POST') {
    const {title,description,price,images,category,properties} = req.body;
    const productDoc = await Product.create({
      title,description,price,images,category,properties,
    })
    res.json(productDoc);
  }

  if (method === 'PUT') {
    const {title,description,price,images,category,properties,_id} = req.body;
    await Product.updateOne({_id}, {title,description,price,images,category,properties});
    res.json(true);
  }

  if (method === 'DELETE') {
    try {
      if (req.query?.id) {
        const product = await Product.findById(req.query.id);
        
        if (product && product.images?.length > 0) {
          for (const imageUrl of product.images) {
            try {
              // Декодируем URL перед извлечением имени файла
              const decodedUrl = decodeURIComponent(imageUrl);
              // Извлекаем имя файла, убирая все лишние части
              const fileName = decodedUrl.split('/').pop().split('?')[0];
              // Удаляем префикс "images/" если он есть
              const trimmedFileName = fileName.startsWith('images/') ? fileName.slice(7) : fileName;
  
              if (trimmedFileName) {
                const file = bucket.file(`images/${trimmedFileName}`);
                const [exists] = await file.exists();
                if (exists) {
                  await file.delete();
                  console.log(`Файл ${trimmedFileName} успешно удален`);
                } else {
                  console.log(`Файл ${trimmedFileName} не существует`);
                }
              }
            } catch (error) {
              console.error(`Ошибка при удалении файла ${imageUrl}: ${error.message}`);
            }
          }
        }
  
        await Product.deleteOne({_id: req.query.id});
        res.json({success: true});
      } else {
        res.status(400).json({error: 'ID продукта не указан'});
      }
    } catch (error) {
      console.error('Ошибка при удалении продукта:', error);
      res.status(500).json({
        error: 'Ошибка при удалении продукта',
        details: error.message
      });
    }
  }
}