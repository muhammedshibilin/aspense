const Wishlist = require("../model/wishlistModel");

exports.WishlistLoad = async (req, res) => {
  try {
    const user = req.session.user_id;
    const wishlistData = await Wishlist.find({ user: user }).populate(
      "products.product"
    );
    console.log("widaaaaata", wishlistData);
    res.render("wishlist", { user: user, wishlistData: wishlistData });
  } catch (e) {
    console.log("error while loading the wishlist", e);
    res.status(500).render("500")
  }
};

exports.addToWish = async (req, res) => {
  try {
    // Ensure the product ID is correctly extracted from the request body
    const id = req.body.productId;
    const userId = req.session.user_id;

    // Find the wishlist for the current user
    const wishData = await Wishlist.findOne({ user: userId });
    console.log("wishData", "hhhadkhadshakjdhkjahdfhadshasdh");

    if (wishData) {
      // Check if the product is already in the wishlist
      const productExists = wishData.products.some(
        (product) => product.product.toString() === id
      );

      if (productExists) {
        // If the product exists, remove it from the wishlist
        const removedWishlist = await Wishlist.findOneAndUpdate(
          { user: userId },
          { $pull: { products: { product: id } } },
          { new: true }
        );
        console.log("removed", removedWishlist);
        res.json({ removed: true });
      } else {
        const wishlistUpdate = await Wishlist.findOneAndUpdate(
          { user: userId },
          { $addToSet: { products: { product: id } } },
          { upsert: true, new: true }
        );
        console.log("updation of wishlist", wishlistUpdate);
        res.json({ added: true });
      }
    } else {
      if (!userId) {
        return res.json({ login: true });
      }
      const newWishlist = new Wishlist({
        user: userId,
        products: [{ product: id }],
      });
      await newWishlist.save();
      console.log("new wishlist created", newWishlist);
      res.json({ added: true });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render("500", { error: error.message });
  }
};

exports.removeFromWish = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.session.user_id;
    console.log("afsjdfkjhsdfgklhgfd", productId, userId);

    const wishDelete = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { product: productId } } }, // Corrected here
      { new: true }
    );

    console.log("de;eee", wishDelete);
    if (!wishDelete) {
      return res.status(404).json({ error: "Product not found in wishlist" });
    } else {
      res.json({ remove: true, message: "Item removed from wishlist" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render("500", { error: error.message });
  }
};
