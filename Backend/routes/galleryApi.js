import express from "express";
import multer from "multer";
import { 
  uploadProductImages, 
  fetchProductImages,
  deleteImage 
} from "../controllers/galleryController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/images/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.route("/:productId/images")
  .post(verifyToken, verifyAdmin, upload.array("images", 10), uploadProductImages)
  .get(fetchProductImages);

router.delete("/images/:imageId", verifyToken, verifyAdmin, deleteImage);

export default router;