import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import { MdKeyboardArrowRight } from "react-icons/md";

/* ── Static product catalogue ── */
const PRODUCTS = [
  {
    id: "tshirt-black",
    name: 'HOA Nightmare T-Shirt',
    description: '"Love My Home, Hate My HOA." — Unisex cotton tee',
    price: 24.99,
    image: null,
    sizes: ["S", "M", "L", "XL", "2XL"],
    color: "Black",
  },
  {
    id: "sweatshirt-black",
    name: 'HOA Nightmare Sweatshirt',
    description: '"Love My Home, Hate My HOA." — Heavy blend crewneck',
    price: 39.99,
    image: null,
    sizes: ["S", "M", "L", "XL", "2XL"],
    color: "Black",
  },
  {
    id: "tshirt-white",
    name: 'HOA Nightmare T-Shirt (White)',
    description: '"Love My Home, Hate My HOA." — Unisex cotton tee',
    price: 24.99,
    image: null,
    sizes: ["S", "M", "L", "XL", "2XL"],
    color: "White",
  },
];

/* ── Placeholder logo block ── */
const ShirtPlaceholder = ({ color }) => (
  <div
    className={`w-full h-full flex items-center justify-center rounded-lg text-center p-4
      ${color === "White" ? "bg-gray-100 border border-gray-200" : "bg-[#1a1a1a]"}`}
  >
    <div>
      <p className={`text-[11px] font-bold tracking-widest mb-1 ${color === "White" ? "text-gray-400" : "text-gray-500"}`}>
        HOA
      </p>
      <p className={`text-[13px] font-bold italic leading-tight ${color === "White" ? "text-gray-700" : "text-white"}`}>
        Love My Home,<br />Hate My HOA.
      </p>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   Cart page
══════════════════════════════════════════ */
const Cart = () => {
  /* cart items: { productId, size, qty } */
  const [cartItems, setCartItems] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addedFeedback, setAddedFeedback] = useState("");

  /* add to cart */
  const addToCart = (product) => {
    const size = selectedSizes[product.id];
    if (!size) {
      setAddedFeedback(`${product.id}:nosize`);
      setTimeout(() => setAddedFeedback(""), 2000);
      return;
    }
    setCartItems((prev) => {
      const key = `${product.id}-${size}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { key, productId: product.id, size, qty: 1, product }];
    });
    setAddedFeedback(`${product.id}:added`);
    setTimeout(() => setAddedFeedback(""), 1800);
  };

  const updateQty = (key, delta) => {
    setCartItems((prev) =>
      prev
        .map((i) => i.key === key ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (key) => setCartItems((prev) => prev.filter((i) => i.key !== key));

  const subtotal = cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="min-h-screen bg-[#f9f9f7] py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Page heading ── */}
        <div className="flex items-center gap-3 mb-8">
          <FaShoppingCart size={26} className="text-[#0a4d2c]" />
          <h1 className="text-[28px] font-bold text-[#0a4d2c]">HOA Nightmares Store</h1>
          {totalItems > 0 && (
            <span className="bg-[#c8102e] text-white text-[12px] font-bold px-2.5 py-0.5 rounded-full">
              {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Product list ── */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-[15px] font-bold text-[#444444] uppercase tracking-wide mb-2">
              Wear Your Stance to the Next Board Meeting
            </h2>

            {PRODUCTS.map((product) => {
              const isAdded   = addedFeedback === `${product.id}:added`;
              const needsSize = addedFeedback === `${product.id}:nosize`;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-[16px] border border-[#eeeeee] shadow-sm p-5 flex gap-5"
                >
                  {/* product image */}
                  <div className="w-[100px] h-[100px] shrink-0 rounded-lg overflow-hidden">
                    <ShirtPlaceholder color={product.color} />
                  </div>

                  {/* product details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-[#222222]">{product.name}</h3>
                    <p className="text-[12px] text-[#777777] mt-0.5 mb-3">{product.description}</p>

                    {/* size selector */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSizes((p) => ({ ...p, [product.id]: sz }))}
                          className={`w-9 h-9 rounded-lg text-[12px] font-bold border transition-colors
                            ${selectedSizes[product.id] === sz
                              ? "bg-[#0a4d2c] text-white border-[#0a4d2c]"
                              : "bg-white text-[#444444] border-[#dddddd] hover:border-[#0a4d2c]"
                            }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>

                    {needsSize && (
                      <p className="text-[12px] text-[#c8102e] font-semibold mb-2">
                        Please select a size first.
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-[18px] font-bold text-[#0a4d2c]">
                        ${product.price.toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-colors
                          ${isAdded
                            ? "bg-[#0a4d2c] text-white"
                            : "bg-[#c8102e] text-white hover:bg-black"
                          }`}
                      >
                        {isAdded ? "✓ Added!" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Cart summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[16px] border border-[#eeeeee] shadow-sm p-6 sticky top-24">
              <h2 className="text-[16px] font-bold text-[#333333] mb-5 pb-3 border-b border-[#eeeeee]">
                Your Cart
              </h2>

              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <FaShoppingCart size={36} className="mx-auto text-[#dddddd] mb-3" />
                  <p className="text-[13px] text-[#999999] font-medium">Your cart is empty.</p>
                  <p className="text-[12px] text-[#bbbbbb] mt-1">
                    Select a size and add an item above.
                  </p>
                </div>
              ) : (
                <>
                  {/* cart line items */}
                  <div className="space-y-4 mb-5">
                    {cartItems.map((item) => (
                      <div key={item.key} className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#333333] truncate">
                            {item.product.name}
                          </p>
                          <p className="text-[11px] text-[#888888]">Size: {item.size}</p>
                          <p className="text-[12px] font-bold text-[#0a4d2c] mt-0.5">
                            ${(item.product.price * item.qty).toFixed(2)}
                          </p>
                        </div>

                        {/* qty controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => updateQty(item.key, -1)}
                            className="w-6 h-6 rounded border border-[#dddddd] flex items-center justify-center text-[#555555] hover:bg-gray-50 transition"
                          >
                            <FaMinus size={9} />
                          </button>
                          <span className="w-6 text-center text-[13px] font-bold">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.key, 1)}
                            className="w-6 h-6 rounded border border-[#dddddd] flex items-center justify-center text-[#555555] hover:bg-gray-50 transition"
                          >
                            <FaPlus size={9} />
                          </button>
                          <button
                            onClick={() => removeItem(item.key)}
                            className="w-6 h-6 rounded border border-[#ffdddd] bg-[#fff5f5] flex items-center justify-center text-[#c8102e] hover:bg-red-50 transition ml-1"
                          >
                            <FaTrash size={9} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* subtotal */}
                  <div className="border-t border-[#eeeeee] pt-4 mb-5 space-y-2">
                    <div className="flex justify-between text-[13px] text-[#666666]">
                      <span>Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[12px] text-[#999999]">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  {/* checkout note — redirect to external store */}
                  <div className="bg-[#f9f9f7] rounded-lg p-3 mb-4 text-[11px] text-[#888888] leading-relaxed">
                    Orders are fulfilled through our print partner. You'll be
                    redirected to complete your purchase securely.
                  </div>

                  <button
                    type="button"
                    className="w-full bg-[#c8102e] text-white py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-black transition-colors"
                  >
                    Proceed to Checkout <MdKeyboardArrowRight size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="w-full mt-3 text-[12px] text-[#999999] hover:text-[#c8102e] transition-colors font-medium"
                  >
                    Clear cart
                  </button>
                </>
              )}

              {/* disclaimer / back link */}
              <div className="mt-6 pt-4 border-t border-[#eeeeee] text-center">
                <Link
                  to="/"
                  className="text-[12px] text-[#0a4d2c] font-semibold hover:underline"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Cart;