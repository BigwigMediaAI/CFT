const BlogPost = require("../models/Blog.model");

// Create new blog post (expects HTML content from React Quill)

exports.newBlogPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, author, tags } = req.body;

    if (!req.file || (!req.file.path && !req.file.secure_url)) {
      return res.status(400).json({ error: "Cover image is required." });
    }

    if (!content || typeof content !== "string") {
      return res
        .status(400)
        .json({ error: "Blog content (HTML) is required." });
    }

    const coverImage = req.file.secure_url || req.file.path;

    // ✅ Handle schemaMarkup as array (from frontend or Postman)
    let schemaMarkup = [];
    if (req.body.schemaMarkup) {
      if (Array.isArray(req.body.schemaMarkup)) {
        schemaMarkup = req.body.schemaMarkup;
      } else {
        schemaMarkup = [req.body.schemaMarkup];
      }
    }

    const blogPost = new BlogPost({
      title,
      slug,
      excerpt,
      content,
      author,
      tags: tags?.split(",").map((tag) => tag.trim()),
      coverImage,
      schemaMarkup, // stored as array
    });

    await blogPost.save();

    return res.status(201).json({
      message: "Blog post created successfully.",
      blogPost,
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Get all blog posts, latest first
exports.getBlog = async (req, res) => {
  try {
    const data = await BlogPost.find().sort({ datePublished: -1 }); // Sort by newest first
    if (!data || data.length === 0) {
      return res.status(404).json({ msg: "No blog posts found" });
    }
    res.status(200).json(data);
  } catch (error) {
    console.log("Error fetching blogs:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Update blog post by slug
exports.updateBlogPostBySlug = async (req, res) => {
  const { slug } = req.params;
  const { title, content, author, excerpt, tags, schemaMarkup } = req.body;

  try {
    const updateFields = {
      ...(title && { title }),
      ...(content && { content }),
      ...(author && { author }),
      ...(excerpt && { excerpt }),
      ...(tags && { tags }),
      ...(schemaMarkup && { schemaMarkup }), // 🔥 store as-is
      lastUpdated: new Date(),
    };

    if (req.file && (req.file.secure_url || req.file.path)) {
      updateFields.coverImage = req.file.secure_url || req.file.path;
    }

    const updatedBlogPost = await BlogPost.findOneAndUpdate(
      { slug },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedBlogPost) {
      return res.status(404).json({ msg: "Blog post not found" });
    }

    res.status(200).json({
      msg: "Blog post updated successfully",
      blogPost: updatedBlogPost,
    });
  } catch (error) {
    console.error("Update error:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Delete blog post by slug
exports.deleteBlogPostBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const deletedBlogPost = await BlogPost.findOneAndDelete({ slug });

    if (!deletedBlogPost) {
      return res.status(404).json({ msg: "Blog post not found" });
    }

    res.status(200).json({ msg: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Update only cover image
exports.updateBlogImageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // Use Cloudinary URL (secure_url or path)
    const imageUrl = req.file.secure_url || req.file.path;

    const updatedBlog = await BlogPost.findOneAndUpdate(
      { slug },
      {
        coverImage: imageUrl,
        lastUpdated: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({
      message: "Cover image updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating cover image:", error);
    res.status(500).json({ message: "Error updating cover image", error });
  }
};
