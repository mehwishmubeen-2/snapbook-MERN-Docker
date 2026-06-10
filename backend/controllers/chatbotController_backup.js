const User = require("../models/user");
const Order = require("../models/order");
const PhotographerProfile = require("../models/photographerProfile");
const Cart = require("../models/cart");

// FAQ knowledge base for SnapBook
const FAQ_KNOWLEDGE = `
You are SnapBook's AI assistant. SnapBook is a service-based platform to book professional photographers.

FAQ:
- Booking: Customers browse photographers, add to cart, and checkout to create a booking order.
- Cancellation: Orders can be cancelled before the event date from the customer dashboard.
- Payment: Payments are processed securely. Refunds go back within 5-7 business days.
- Photographers: All photographers are verified and approved by admin before going live.
- Approval: Photographers register and wait for admin approval before accepting bookings.
- Reviews: Customers can leave reviews after a completed booking.
- Pricing: Each photographer sets their own hourly rate visible on their profile.
`;

exports.chat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user._id;

    // 1. Classify intent (with fallback keyword matching)
    let intent = await classifyIntent(message);
    
    console.log(`[CHATBOT] User: ${message.substring(0, 50)}... | Intent: ${intent}`);

    let responseData = {};

    if (intent === "SEARCH") {
      responseData = await handleSearch(message);
    } else if (intent === "RECOMMEND") {
      responseData = await handleRecommend(userId);
    } else if (intent === "BOOKING_STATUS") {
      responseData = await handleBookingStatus(userId, message);
    } else if (intent === "CART_ADD") {
      responseData = await handleCartView(userId);
      responseData.message = "To add a photographer to your cart, visit their profile and select a date. Want me to find photographers for you?";
    } else if (intent === "CART_REMOVE") {
      responseData = await handleCartView(userId);
      responseData.message = "You can remove items from your cart in the shopping cart page. Would you like me to show you what's in your cart?";
    } else if (intent === "CART_VIEW") {
      responseData = await handleCartView(userId);
    } else if (intent === "FAQ") {
      responseData = await handleFAQ(message);
    } else if (intent === "GREETING") {
      const user = await User.findById(userId).select("name");
      responseData = {
        type: "text",
        message: `Hi ${user?.name || "there"}! 👋 I'm SnapBook's AI assistant. I can help you find photographers, check your bookings, manage your cart, or answer questions. What would you like to do?`
      };
    } else {
      // General fallback — let Claude answer naturally with fallback
      const reply = await callClaude([
        { role: "system", content: FAQ_KNOWLEDGE },
        ...conversationHistory.slice(-6),
        { role: "user", content: message }
      ]);
      responseData = { type: "text", message: reply };
    }

    res.json({ success: true, intent, ...responseData });
  } catch (err) {
    console.error("[CHATBOT ERROR]", err);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
};

// ── Intent Classification with Fallback ────────────────────
async function classifyIntent(message) {
  const msg = message.toLowerCase();
  
  // Keyword-based fallback classification
  if (msg.includes("search") || msg.includes("find") || msg.includes("looking for") || msg.includes("show me")) {
    return "SEARCH";
  }
  if (msg.includes("recommend") || msg.includes("suggest") || msg.includes("best") || msg.includes("top")) {
    return "RECOMMEND";
  }
  if (msg.includes("order") || msg.includes("booking") || msg.includes("status") || msg.includes("where is")) {
    return "BOOKING_STATUS";
  }
  if (msg.includes("add to cart") || msg.includes("add cart") || msg.includes("book")) {
    return "CART_ADD";
  }
  if (msg.includes("remove") || msg.includes("delete") || msg.includes("clear cart")) {
    return "CART_REMOVE";
  }
  if (msg.includes("cart") || msg.includes("shopping")) {
    return "CART_VIEW";
  }
  if (msg.includes("policy") || msg.includes("shipping") || msg.includes("payment") || msg.includes("cancel") || msg.includes("how") || msg.includes("what")) {
    return "FAQ";
  }
  if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey") || msg.match(/^(hello|hi|hey|greetings)/i)) {
    return "GREETING";
  }
  
  // Try to use Claude if available
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey !== "your-anthropic-api-key-here") {
    try {
      const intentResponse = await callClaude([
        {
          role: "user",
          content: `Classify this user message into exactly one of these intents:
SEARCH, RECOMMEND, BOOKING_STATUS, CART_ADD, CART_REMOVE, CART_VIEW, FAQ, GREETING, OTHER

Message: "${message}"

Reply with ONLY the intent word, nothing else.`
        }
      ]);
      const classified = intentResponse.trim().toUpperCase();
      if (["SEARCH", "RECOMMEND", "BOOKING_STATUS", "CART_ADD", "CART_REMOVE", "CART_VIEW", "FAQ", "GREETING", "OTHER"].includes(classified)) {
        return classified;
      }
    } catch (err) {
      console.log("Claude API classification failed, using fallback");
    }
  }
  
  return "OTHER";
}

// ── Filter Extraction (Fallback) ────────────────────────────
async function extractSearchFilters(message) {
  const msg = message.toLowerCase();
  let filters = {};

  // Event types
  const eventTypes = ["wedding", "portrait", "event", "corporate", "product", "maternity", "engagement", "birthday", "graduation"];
  eventTypes.forEach(type => {
    if (msg.includes(type)) filters.eventType = type.charAt(0).toUpperCase() + type.slice(1);
  });

  // Price extraction (e.g., "under $50", "$50-100", "less than 100")
  const priceMatch = msg.match(/\$?(\d+)/);
  if (msg.includes("under") || msg.includes("less than") || msg.includes("below")) {
    if (priceMatch) filters.maxPrice = parseInt(priceMatch[1]);
  }

  // Rating (e.g., "4 stars", "highly rated")
  if (msg.includes("5 star")) filters.minRating = 5;
  else if (msg.includes("4 star") || msg.includes("highly rated")) filters.minRating = 4;
  else if (msg.includes("3 star")) filters.minRating = 3;

  // City (common Pakistani cities)
  const cities = ["lahore", "karachi", "islamabad", "rawalpindi", "peshawar", "multan", "faisalabad", "hyderabad", "quetta"];
  cities.forEach(city => {
    if (msg.includes(city)) filters.city = city.charAt(0).toUpperCase() + city.slice(1);
  });

  // Try Claude API if available
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey !== "your-anthropic-api-key-here") {
    try {
      const filtersJSON = await callClaude([
        {
          role: "user",
          content: `Extract search filters from this message as JSON.
Message: "${message}"
Return ONLY valid JSON with these optional keys: city, eventType, maxPrice, minRating, search
Example: {"city":"Lahore","eventType":"Wedding","maxPrice":50}
If a field is not mentioned, omit it.`
        }
      ]);
      const claudeFilters = JSON.parse(filtersJSON.replace(/```json|```/g, "").trim());
      filters = { ...filters, ...claudeFilters };
    } catch (err) {
      console.log("Claude filter extraction failed, using keyword fallback");
    }
  }

  // Fallback search term (if no specific filters found)
  if (Object.keys(filters).length === 0) {
    filters.search = message;
  }

  return filters;
}

// ── Handlers ──────────────────────────────────────────────

async function handleSearch(message) {
  // Extract filters from natural language (with fallback)
  let filters = await extractSearchFilters(message);

  const query = { isApproved: true };
  if (filters.city) query.city = new RegExp(filters.city, "i");
  if (filters.eventType) query.eventTypes = filters.eventType;
  if (filters.maxPrice) query.pricePerHour = { $lte: filters.maxPrice };
  if (filters.minRating) query.rating = { $gte: filters.minRating };
  if (filters.search) {
    query.$or = [
      { specialization: new RegExp(filters.search, "i") },
      { bio: new RegExp(filters.search, "i") }
    ];
  }

  const photographers = await PhotographerProfile.find(query)
    .populate("userId", "name profileImage")
    .sort({ rating: -1 })
    .limit(5);

  return {
    type: "photographers",
    message: photographers.length
      ? `Found ${photographers.length} photographer${photographers.length > 1 ? "s" : ""} for you:`
      : "No photographers match your criteria. Try broadening your search.",
    photographers: photographers.map(p => ({
      id: p._id,
      slug: p.slug,
      name: p.userId?.name,
      image: p.userId?.profileImage,
      specialization: p.specialization,
      city: p.city,
      pricePerHour: p.pricePerHour,
      rating: p.rating,
      totalReviews: p.totalReviews
    }))
  };
}

async function handleRecommend(userId) {
  // Get user's booking history for context
  const recentOrders = await Order.find({ customerId: userId })
    .populate("photographerId", "specialization eventTypes")
    .sort({ createdAt: -1 })
    .limit(5);

  const preferredTypes = [];
  recentOrders.forEach(o => {
    if (o.eventType) preferredTypes.push(o.eventType);
  });

  const query = { isApproved: true, rating: { $gte: 4 } };
  if (preferredTypes.length > 0) {
    query.eventTypes = { $in: preferredTypes };
  }

  const photographers = await PhotographerProfile.find(query)
    .populate("userId", "name profileImage")
    .sort({ rating: -1, totalReviews: -1 })
    .limit(4);

  const reason = preferredTypes.length > 0
    ? `Based on your interest in ${[...new Set(preferredTypes)].join(", ")} photography:`
    : "Here are our top-rated photographers:";

  return {
    type: "photographers",
    message: reason,
    photographers: photographers.map(p => ({
      id: p._id,
      slug: p.slug,
      name: p.userId?.name,
      image: p.userId?.profileImage,
      specialization: p.specialization,
      city: p.city,
      pricePerHour: p.pricePerHour,
      rating: p.rating,
      totalReviews: p.totalReviews
    }))
  };
}

async function handleBookingStatus(userId, message) {
  const orders = await Order.find({ customerId: userId })
    .populate("photographerId", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  if (!orders.length) {
    return { type: "text", message: "You don't have any bookings yet. Would you like me to help you find a photographer?" };
  }

  return {
    type: "bookings",
    message: "Here are your recent bookings:",
    bookings: orders.map(o => ({
      id: o._id,
      photographer: o.photographerId?.name || "Photographer",
      eventType: o.eventType,
      eventDate: o.eventDate,
      location: o.location,
      status: o.status,
      totalAmount: o.totalAmount,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt
    }))
  };
}

async function handleCartView(userId) {
  const cart = await Cart.findOne({ userId }).populate("items.photographerId", "name profileImage");

  if (!cart || !cart.items?.length) {
    return { type: "text", message: "Your cart is empty. Want me to help find a photographer to book?" };
  }

  return {
    type: "cart",
    message: `You have ${cart.items.length} item${cart.items.length > 1 ? "s" : ""} in your cart:`,
    cart: {
      items: cart.items.map(item => ({
        id: item._id,
        photographer: item.photographerId?.name,
        eventType: item.eventType,
        eventDate: item.eventDate,
        duration: item.duration,
        totalPrice: item.totalPrice
      })),
      totalCost: cart.totalCost
    }
  };
}

async function handleFAQ(message) {
  // Try to answer from FAQ knowledge base first
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  const msg = message.toLowerCase();
  
  // Quick FAQ fallback responses
  if (msg.includes("cancel")) {
    return { 
      type: "text", 
      message: "📋 **Cancellation Policy:**\nOrders can be cancelled before the event date from your customer dashboard. Refunds are processed within 5-7 business days." 
    };
  }
  if (msg.includes("shipping") || msg.includes("delivery")) {
    return { 
      type: "text", 
      message: "🚚 **Shipping Info:**\nFor photography bookings, the event takes place on your chosen date at your location. Our photographers are available across multiple cities." 
    };
  }
  if (msg.includes("payment")) {
    return { 
      type: "text", 
      message: "💳 **Payment Methods:**\nPayments are processed securely through our platform. All transactions are encrypted and verified. Refunds go back within 5-7 business days." 
    };
  }
  if (msg.includes("photographer") || msg.includes("approval")) {
    return { 
      type: "text", 
      message: "✅ **About Our Photographers:**\nAll photographers on SnapBook are verified and approved by our admin team before going live. You can view ratings and reviews from previous customers." 
    };
  }
  if (msg.includes("review")) {
    return { 
      type: "text", 
      message: "⭐ **Reviews:**\nYou can leave reviews after a completed booking. Your feedback helps other customers and helps photographers improve their services." 
    };
  }
  if (msg.includes("price") || msg.includes("pricing")) {
    return { 
      type: "text", 
      message: "💰 **Pricing:**\nEach photographer sets their own hourly rate. You can see all pricing details on their profile before booking." 
    };
  }
  
  // Use Claude if available
  if (apiKey && apiKey !== "your-anthropic-api-key-here") {
    try {
      const answer = await callClaude([
        { role: "system", content: FAQ_KNOWLEDGE },
        { role: "user", content: message }
      ]);
      return { type: "text", message: answer };
    } catch (err) {
      console.log("Claude FAQ failed, using fallback");
    }
  }
  
  // Final fallback
  return { 
    type: "text", 
    message: "📖 I found this in our FAQ: For more info about bookings, payments, cancellations, and our photographers, please check out our help center or contact support." 
  };
}

async function callClaude(messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Check if API key is properly configured
  if (!apiKey || apiKey === "your-anthropic-api-key-here") {
    console.log("[CHATBOT] No valid Anthropic API key - using fallback mode");
    
    // Smart fallback response based on message content
    const lastMsg = messages[messages.length - 1]?.content || "";
    const msg = lastMsg.toLowerCase();
    
    if (msg.includes("help") || msg.includes("can you")) {
      return "I can help you with:\n• 🔍 Finding photographers\n• ⭐ Getting recommendations\n• 📋 Checking booking status\n• 🛒 Managing your cart\n• ❓ Answering FAQs\n\nWhat would you like help with?";
    }
    if (msg.includes("how")) {
      return "That's a great question! For detailed info, please check our FAQ section or contact our support team.";
    }
    if (msg.includes("thanks") || msg.includes("thank you")) {
      return "You're welcome! 😊 Is there anything else I can help you with?";
    }
    
    return "I'm in demo mode! Please add your Anthropic API key to .env (ANTHROPIC_API_KEY) for full AI capabilities. For now, I can still help with:\n• Finding photographers\n• Tracking bookings\n• Viewing cart\n• Answering common FAQs";
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[CHATBOT] Claude API error:", errorData);
      
      if (response.status === 401) {
        return "⛔ API key error. Please check your ANTHROPIC_API_KEY in .env";
      }
      if (response.status === 429) {
        return "⏱️ Rate limited. Please try again in a moment.";
      }
      
      return "❌ Sorry, I'm having trouble with the AI service. Please try again.";
    }
    
    const data = await response.json();
    if (!data.content || !data.content[0]) {
      console.error("[CHATBOT] Invalid Claude response:", data);
      return "Sorry, I couldn't process that. Please try again.";
    }
    
    return data.content[0].text || "I couldn't generate a response.";
  } catch (err) {
    console.error("[CHATBOT] Claude API fetch error:", err.message);
    return "🔌 Connection error with AI service. Please check your internet and try again.";
  }
}