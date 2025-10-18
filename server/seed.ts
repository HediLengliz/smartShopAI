// Seed script to populate MongoDB with sample data
import 'dotenv/config';
import { connectDB } from "./db";
import { 
  User, 
  Product, 
  List, 
  ListItem, 
  Order, 
  OrderItem, 
  Payment, 
  FAQ, 
  Message, 
  Feedback 
} from "./models";

async function seed() {
  console.log("Seeding MongoDB database...");

  try {
    // Connect to MongoDB
    await connectDB();

    // Clear existing data (optional - remove in production)
    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Product.deleteMany({});
    await List.deleteMany({});
    await ListItem.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await Payment.deleteMany({});
    await FAQ.deleteMany({});
    await Message.deleteMany({});
    await Feedback.deleteMany({});

    // Create demo user
    const user = new User({
      name: "Demo User",
      email: "demo@example.com",
    });
    await user.save();
    console.log("✓ User created");

    // Create sample products
    const sampleProducts = [
      {
        name: "Organic Apples",
        description: "Fresh organic apples from local farms",
        price: 3.99,
        stock: 150,
        stockAlertThreshold: 20,
        category: "Fruits",
        imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300"
      },
      {
        name: "Whole Milk",
        description: "Fresh whole milk, 1 gallon",
        price: 4.49,
        stock: 80,
        stockAlertThreshold: 15,
        category: "Dairy",
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300"
      },
      {
        name: "Bread - Whole Wheat",
        description: "Freshly baked whole wheat bread",
        price: 2.99,
        stock: 60,
        stockAlertThreshold: 10,
        category: "Bakery",
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300"
      },
      {
        name: "Chicken Breast",
        description: "Boneless skinless chicken breast, per lb",
        price: 6.99,
        stock: 45,
        stockAlertThreshold: 10,
        category: "Meat",
        imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300"
      },
      {
        name: "Potatoes",
        description: "Russet potatoes, 5 lb bag",
        price: 3.49,
        stock: 120,
        stockAlertThreshold: 20,
        category: "Vegetables",
        imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300"
      },
      {
        name: "Eggs - Dozen",
        description: "Grade A large eggs, 1 dozen",
        price: 4.99,
        stock: 90,
        stockAlertThreshold: 15,
        category: "Dairy",
        imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300"
      },
      {
        name: "Tomatoes",
        description: "Fresh vine tomatoes, per lb",
        price: 2.49,
        stock: 75,
        stockAlertThreshold: 15,
        category: "Vegetables",
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300"
      },
      {
        name: "Orange Juice",
        description: "100% pure orange juice, 64 oz",
        price: 5.99,
        stock: 55,
        stockAlertThreshold: 10,
        category: "Beverages",
        imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300"
      },
      {
        name: "Pasta - Spaghetti",
        description: "Italian spaghetti pasta, 1 lb",
        price: 1.99,
        stock: 100,
        stockAlertThreshold: 20,
        category: "Pantry",
        imageUrl: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=300"
      },
      {
        name: "Ground Beef",
        description: "85% lean ground beef, per lb",
        price: 5.99,
        stock: 40,
        stockAlertThreshold: 10,
        category: "Meat",
        imageUrl: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300"
      },
      {
        name: "Bananas",
        description: "Fresh bananas, per lb",
        price: 0.79,
        stock: 200,
        stockAlertThreshold: 30,
        category: "Fruits",
        imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300"
      },
      {
        name: "Rice - Basmati",
        description: "Premium basmati rice, 2 lb bag",
        price: 6.49,
        stock: 65,
        stockAlertThreshold: 15,
        category: "Pantry",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300"
      },
      {
        name: "Butter",
        description: "Unsalted butter, 1 lb",
        price: 4.29,
        stock: 70,
        stockAlertThreshold: 15,
        category: "Dairy",
        imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300"
      },
      {
        name: "Carrots",
        description: "Fresh carrots, 2 lb bag",
        price: 2.29,
        stock: 85,
        stockAlertThreshold: 15,
        category: "Vegetables",
        imageUrl: "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300"
      },
      {
        name: "Coffee - Medium Roast",
        description: "Premium medium roast coffee beans, 12 oz",
        price: 9.99,
        stock: 50,
        stockAlertThreshold: 10,
        category: "Beverages",
        imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300"
      },
      {
        name: "Onions",
        description: "Yellow onions, 3 lb bag",
        price: 1.99,
        stock: 95,
        stockAlertThreshold: 20,
        category: "Vegetables",
        imageUrl: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=300"
      },
      {
        name: "Cheese - Cheddar",
        description: "Sharp cheddar cheese, 8 oz block",
        price: 4.79,
        stock: 60,
        stockAlertThreshold: 15,
        category: "Dairy",
        imageUrl: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300"
      },
      {
        name: "Cereal - Oat Flakes",
        description: "Healthy oat flakes cereal, 18 oz",
        price: 5.49,
        stock: 45,
        stockAlertThreshold: 10,
        category: "Pantry",
        imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300"
      },
      {
        name: "Yogurt - Greek",
        description: "Plain Greek yogurt, 32 oz",
        price: 6.99,
        stock: 35,
        stockAlertThreshold: 10,
        category: "Dairy",
        imageUrl: "https://images.unsplash.com/photo-1571212058242-543d98a8f8ed?w=300"
      },
      {
        name: "Spinach",
        description: "Fresh baby spinach, 5 oz bag",
        price: 2.99,
        stock: 40,
        stockAlertThreshold: 10,
        category: "Vegetables",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300"
      }
    ];

    const products = await Product.insertMany(sampleProducts);
    console.log("✓ Sample products created");

    // Create sample shopping lists
    const weeklyList = new List({
      userId: user._id,
      title: "Weekly Groceries",
    });
    await weeklyList.save();

    const partyList = new List({
      userId: user._id,
      title: "Party Supplies",
    });
    await partyList.save();

    console.log("✓ Sample lists created");

    // Create sample list items
    const listItems = [
      {
        listId: weeklyList._id,
        productId: products[0]._id, // Organic Apples
        name: "Organic Apples",
        quantity: 2,
        unit: "lbs",
        status: "pending"
      },
      {
        listId: weeklyList._id,
        productId: products[1]._id, // Whole Milk
        name: "Whole Milk",
        quantity: 1,
        unit: "gallon",
        status: "urgent"
      },
      {
        listId: weeklyList._id,
        productId: products[2]._id, // Bread
        name: "Bread - Whole Wheat",
        quantity: 2,
        unit: "loaves",
        status: "pending"
      },
      {
        listId: weeklyList._id,
        name: "Fresh Basil",
        quantity: 1,
        unit: "bunch",
        status: "pending"
      },
      {
        listId: partyList._id,
        productId: products[9]._id, // Ground Beef
        name: "Ground Beef",
        quantity: 3,
        unit: "lbs",
        status: "pending"
      },
      {
        listId: partyList._id,
        productId: products[7]._id, // Orange Juice
        name: "Orange Juice",
        quantity: 2,
        unit: "bottles",
        status: "pending"
      }
    ];

    await ListItem.insertMany(listItems);
    console.log("✓ Sample list items created");

    // Create sample orders
    const order1 = new Order({
      userId: user._id,
      status: "completed",
      totalAmount: 25.47
    });
    await order1.save();

    const order2 = new Order({
      userId: user._id,
      status: "processing",
      totalAmount: 18.99
    });
    await order2.save();

    console.log("✓ Sample orders created");

    // Create sample order items
    const orderItems = [
      {
        orderId: order1._id,
        productId: products[0]._id,
        quantity: 2,
        priceAtPurchase: 3.99
      },
      {
        orderId: order1._id,
        productId: products[1]._id,
        quantity: 1,
        priceAtPurchase: 4.49
      },
      {
        orderId: order1._id,
        productId: products[2]._id,
        quantity: 2,
        priceAtPurchase: 2.99
      },
      {
        orderId: order1._id,
        productId: products[4]._id,
        quantity: 1,
        priceAtPurchase: 3.49
      },
      {
        orderId: order2._id,
        productId: products[9]._id,
        quantity: 2,
        priceAtPurchase: 5.99
      },
      {
        orderId: order2._id,
        productId: products[7]._id,
        quantity: 1,
        priceAtPurchase: 5.99
      }
    ];

    await OrderItem.insertMany(orderItems);
    console.log("✓ Sample order items created");

    // Create sample payments
    const payments = [
      {
        orderId: order1._id,
        amount: 25.47,
        status: "completed",
        paymentMethod: "Credit Card"
      },
      {
        orderId: order2._id,
        amount: 18.99,
        status: "pending",
        paymentMethod: "PayPal"
      }
    ];

    await Payment.insertMany(payments);
    console.log("✓ Sample payments created");

    // Create sample FAQs
    const sampleFaqs = [
      {
        question: "How do I create a shopping list?",
        answer: "Click on 'Shopping Lists' in the sidebar, then click the 'New List' button. Give your list a name and start adding items!",
        category: "Getting Started",
      },
      {
        question: "How does the AI parsing work?",
        answer: "Our NLP agent can understand natural language input like '3 kg apples, 2 liters milk'. Just type your items in plain text and click 'Parse & Add Items'. The AI will automatically extract quantities, units, and product names.",
        category: "AI Features",
      },
      {
        question: "Can I add items manually?",
        answer: "Yes! While we recommend using the AI parser for faster entry, you can also add items one by one using the manual entry form. Just enter the item name, quantity, and unit.",
        category: "Lists",
      },
      {
        question: "How do recommendations work?",
        answer: "Our recommendation engine analyzes your shopping history and suggests products you might need. These appear on the Products page and are personalized based on your past purchases.",
        category: "AI Features",
      },
      {
        question: "What payment methods are accepted?",
        answer: "We accept all major credit cards, debit cards, and digital payment methods. Payment processing is secure and encrypted.",
        category: "Orders & Payments",
      },
      {
        question: "Can I track my order status?",
        answer: "Yes! Go to the Orders page to see all your orders with their current status (pending, processing, completed, or cancelled). You can expand each order to see the items and payment details.",
        category: "Orders & Payments",
      },
      {
        question: "How do I mark items as urgent?",
        answer: "When viewing a list, each item has a status dropdown. Select 'Urgent' to mark important items. They'll appear in a special highlighted section at the top of your list.",
        category: "Lists",
      },
      {
        question: "Can I browse products before adding to a list?",
        answer: "Absolutely! Visit the Products page to browse our full catalog. You can search, filter by category, and add any product directly to one of your lists.",
        category: "Products",
      },
      {
        question: "How do I use the chatbot?",
        answer: "The chatbot is available in the Support section. You can ask questions about the app, get help with features, or request assistance. The AI-powered chatbot can understand natural language and provide helpful responses.",
        category: "AI Features",
      },
      {
        question: "Can I get personalized recommendations?",
        answer: "Yes! Our AI analyzes your shopping patterns and suggests products you might need. Recommendations appear on the Products page and are updated based on your shopping history.",
        category: "AI Features",
      }
    ];

    await FAQ.insertMany(sampleFaqs);
    console.log("✓ Sample FAQs created");

    // Create sample messages for chatbot
    const sampleMessages = [
      {
        userId: user._id,
        content: "Hello! I need help with creating a shopping list.",
        isBot: false,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        userId: user._id,
        content: "I'd be happy to help you create a shopping list! You can start by going to the Shopping Lists page and clicking 'New List'. What would you like to name your list?",
        isBot: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000) // 2 hours ago + 5 minutes
      },
      {
        userId: user._id,
        content: "How do I add items using natural language?",
        isBot: false,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        userId: user._id,
        content: "Great question! You can type items like '3 kg apples, 2 liters milk, 1 loaf bread' and our AI will automatically parse them into structured items. Just use the 'Parse & Add Items' feature in your list!",
        isBot: true,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000 + 2 * 60 * 1000) // 1 hour ago + 2 minutes
      }
    ];

    await Message.insertMany(sampleMessages);
    console.log("✓ Sample messages created");

    // Create sample feedback
    const sampleFeedback = new Feedback({
      userId: user._id,
      content: "The AI parsing feature is amazing! It saves me so much time when creating shopping lists. The recommendations are also very helpful.",
      rating: 5
    });
    await sampleFeedback.save();
    console.log("✓ Sample feedback created");

    console.log("\n✓ MongoDB database seeded successfully!");
    console.log(`✓ Created ${products.length} products`);
    console.log(`✓ Created 2 shopping lists with items`);
    console.log(`✓ Created 2 orders with items and payments`);
    console.log(`✓ Created ${sampleFaqs.length} FAQs`);
    console.log(`✓ Created ${sampleMessages.length} chat messages`);
    console.log(`✓ Created 1 feedback entry`);

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed().catch(console.error);
