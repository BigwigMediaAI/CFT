const router = require("express").Router();
const {
  newBlogPost,
  getBlog,
  updateBlogPostBySlug,
  deleteBlogPostBySlug,
  updateBlogImageBySlug,
} = require("../controller/Blog.controller");
const multer = require("multer");

const storage = require("../config/storage");
const upload = multer({ storage });

router.post("/add", upload.single("coverImage"), newBlogPost);
router.get("/viewblog", getBlog);
router.put("/:slug", upload.single("coverImage"), updateBlogPostBySlug);
router.delete("/:slug", deleteBlogPostBySlug);
router.patch(
  "/:slug/image",
  upload.single("coverImage"),
  updateBlogImageBySlug
);

module.exports = router;
