   import 'dotenv/config.js';
   import fs from 'fs';
   import mongoose from 'mongoose';
   import { DB_NAME } from './constants.js';
   import { Book } from './models/book.model.js';

   const books = JSON.parse(fs.readFileSync(new URL('./books.json', import.meta.url)));

   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

   const result = await Book.bulkWrite(
     books.map((b) => ({
       updateOne: {
         filter: { isbn: b.isbn },
         update: {
           $setOnInsert: {
             ...b,
             totalCopies: b.totalCopies ?? 1,
             availableCopies: b.totalCopies ?? 1,
           },
         },
         upsert: true,
       },
     })),
     { ordered: false }
   );

   console.log(`Inserted ${result.upsertedCount}, skipped ${books.length - result.upsertedCount}`);
   await mongoose.disconnect();