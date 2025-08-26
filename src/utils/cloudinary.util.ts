import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";
import {Readable} from "stream";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


export async function uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {folder: 'usuarios'},
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error('No upload result'));
                } else {
                    resolve(result);
                }
            }
        )

        Readable.from(file.buffer).pipe(uploadStream)
    })
}
