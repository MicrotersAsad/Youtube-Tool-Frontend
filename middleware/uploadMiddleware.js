import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: 'File upload failed' });
    } else if (err) {
      return res.status(500).json({ message: 'An unknown error occurred during file upload' });
    }
    next();
  });
};

export default uploadMiddleware;
