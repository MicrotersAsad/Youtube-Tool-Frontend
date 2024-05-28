import multer from 'multer';

// Configure multer to store files in memory
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload.single('image');
