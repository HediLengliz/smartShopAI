// Seed script to populate database with sample data
import { db } from "./db";
import { users, products, faqs } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  try {
    // Create demo user
    const [user] = await db.insert(users).values({
      name: "Demo User",
      email: "demo@example.com",
    }).returning().onConflictDoNothing();

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
      },
      {
        name: "Whole Milk",
        description: "Fresh whole milk, 1 gallon",
        price: 4.49,
        stock: 80,
        stockAlertThreshold: 15,
        category: "Dairy",
      },
      {
        name: "Bread - Whole Wheat",
        description: "Freshly baked whole wheat bread",
        price: 2.99,
        stock: 60,
        stockAlertThreshold: 10,
        category: "Bakery",
      },
      {
        name: "Chicken Breast",
        description: "Boneless skinless chicken breast, per lb",
        price: 6.99,
        stock: 45,
        stockAlertThreshold: 10,
        category: "Meat",
      },
      {
        name: "Potatoes",
        description: "Russet potatoes, 5 lb bag",
        price: 3.49,
        stock: 120,
        stockAlertThreshold: 20,
        category: "Vegetables",
      },
      {
        name: "Eggs - Dozen",
        description: "Grade A large eggs, 1 dozen",
        price: 4.99,
        stock: 90,
        stockAlertThreshold: 15,
        category: "Dairy",
      },
      {
        name: "Tomatoes",
        description: "Fresh vine tomatoes, per lb",
        price: 2.49,
        stock: 75,
        stockAlertThreshold: 15,
        category: "Vegetables",
      },
      {
        name: "Orange Juice",
        description: "100% pure orange juice, 64 oz",
        price: 5.99,
        stock: 55,
        stockAlertThreshold: 10,
        category: "Beverages",
      },
      {
        name: "Pasta - Spaghetti",
        description: "Italian spaghetti pasta, 1 lb",
        price: 1.99,
        stock: 100,
        stockAlertThreshold: 20,
        category: "Pantry",
      },
      {
        name: "Ground Beef",
        description: "85% lean ground beef, per lb",
        price: 5.99,
        stock: 40,
        stockAlertThreshold: 10,
        category: "Meat",
      },
      {
        name: "Bananas",
        description: "Fresh bananas, per lb",
        price: 0.79,
        stock: 200,
        stockAlertThreshold: 30,
        category: "Fruits",
      },
      {
        name: "Rice - Basmati",
        description: "Premium basmati rice, 2 lb bag",
        price: 6.49,
        stock: 65,
        stockAlertThreshold: 15,
        category: "Pantry",
      },
      {
        name: "Butter",
        description: "Unsalted butter, 1 lb",
        price: 4.29,
        stock: 70,
        stockAlertThreshold: 15,
        category: "Dairy",
      },
      {
        name: "Carrots",
        description: "Fresh carrots, 2 lb bag",
        price: 2.29,
        stock: 85,
        stockAlertThreshold: 15,
        category: "Vegetables",
      },
      {
        name: "Coffee - Medium Roast",
        description: "Premium medium roast coffee beans, 12 oz",
        price: 9.99,
        stock: 50,
        stockAlertThreshold: 10,
        category: "Beverages",
      },
    ];

    await db.insert(products).values(sampleProducts).onConflictDoNothing();
    console.log("✓ Sample products created");

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
    ];

    await db.insert(faqs).values(sampleFaqs).onConflictDoNothing();
    console.log("✓ Sample FAQs created");

    console.log("\n✓ Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed().catch(console.error);
