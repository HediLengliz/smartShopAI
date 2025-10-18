// API Test Script for IntelliCart
// Run with: node test-api.js

const BASE_URL = 'http://localhost:5000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'cyan');
}

function header(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${message}`, 'bold');
  log(`${'='.repeat(60)}`, 'blue');
}

async function testEndpoint(name, method, path, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const result = await response.json();

    if (response.ok) {
      success(`${name} - Status: ${response.status}`);
      return { success: true, data: result, status: response.status };
    } else {
      error(`${name} - Status: ${response.status}`);
      console.log('  Response:', result);
      return { success: false, data: result, status: response.status };
    }
  } catch (err) {
    error(`${name} - Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function runTests() {
  log('\n🚀 IntelliCart API Test Suite\n', 'bold');
  log(`Testing API at: ${BASE_URL}\n`, 'yellow');

  let stats = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Test 1: Get all lists
  header('TEST 1: Get All Shopping Lists');
  const listsTest = await testEndpoint('GET /api/lists', 'GET', '/api/lists');
  stats.total++;
  if (listsTest.success) {
    stats.passed++;
    info(`  Found ${listsTest.data.length} lists`);
    if (listsTest.data.length > 0) {
      info(`  First list: "${listsTest.data[0].title}"`);
    }
  } else {
    stats.failed++;
  }

  // Test 2: Create a new list
  header('TEST 2: Create New Shopping List');
  const createListTest = await testEndpoint(
    'POST /api/lists',
    'POST',
    '/api/lists',
    { title: 'Test List from API Test' }
  );
  stats.total++;
  let createdListId = null;
  if (createListTest.success) {
    stats.passed++;
    createdListId = createListTest.data.id;
    info(`  Created list with ID: ${createdListId}`);
  } else {
    stats.failed++;
  }

  // Test 3: Get specific list
  if (createdListId) {
    header('TEST 3: Get Specific List');
    const getListTest = await testEndpoint(
      'GET /api/lists/:id',
      'GET',
      `/api/lists/${createdListId}`
    );
    stats.total++;
    if (getListTest.success) {
      stats.passed++;
      info(`  List title: "${getListTest.data.title}"`);
    } else {
      stats.failed++;
    }
  }

  // Test 4: Add item to list
  if (createdListId) {
    header('TEST 4: Add Item to List');
    const addItemTest = await testEndpoint(
      'POST /api/lists/:id/items',
      'POST',
      `/api/lists/${createdListId}/items`,
      {
        name: 'Test Apples',
        quantity: 3,
        unit: 'kg',
      }
    );
    stats.total++;
    if (addItemTest.success) {
      stats.passed++;
      info(`  Added item: ${addItemTest.data.name}`);
    } else {
      stats.failed++;
    }
  }

  // Test 5: Get list items
  if (createdListId) {
    header('TEST 5: Get List Items');
    const getItemsTest = await testEndpoint(
      'GET /api/lists/:id/items',
      'GET',
      `/api/lists/${createdListId}/items`
    );
    stats.total++;
    if (getItemsTest.success) {
      stats.passed++;
      info(`  Found ${getItemsTest.data.length} items`);
    } else {
      stats.failed++;
    }
  }

  // Test 6: NLP Parse
  header('TEST 6: NLP Parse Natural Language');
  const nlpTest = await testEndpoint(
    'POST /api/nlp/parse',
    'POST',
    '/api/nlp/parse',
    {
      text: '3 kg apples, 2 liters milk, 1 loaf bread',
      listId: createdListId,
    }
  );
  stats.total++;
  if (nlpTest.success) {
    stats.passed++;
    info(`  Parsed ${nlpTest.data.items.length} items`);
    info(`  Confidence: ${(nlpTest.data.confidence * 100).toFixed(1)}%`);
  } else {
    stats.failed++;
  }

  // Test 7: Get all products
  header('TEST 7: Get All Products');
  const productsTest = await testEndpoint('GET /api/products', 'GET', '/api/products');
  stats.total++;
  let firstProductId = null;
  if (productsTest.success) {
    stats.passed++;
    info(`  Found ${productsTest.data.length} products`);
    if (productsTest.data.length > 0) {
      firstProductId = productsTest.data[0].id;
      info(`  First product: "${productsTest.data[0].name}" - $${productsTest.data[0].price}`);
    }
  } else {
    stats.failed++;
  }

  // Test 8: Get recommendations
  header('TEST 8: Get Personalized Recommendations');
  const recsTest = await testEndpoint(
    'GET /api/recommendations',
    'GET',
    '/api/recommendations?limit=4'
  );
  stats.total++;
  if (recsTest.success) {
    stats.passed++;
    info(`  Got ${recsTest.data.products.length} recommendations`);
    if (recsTest.data.products.length > 0) {
      info(`  Top recommendation: "${recsTest.data.products[0].productName}"`);
      info(`  Reason: ${recsTest.data.products[0].reason}`);
    }
  } else {
    stats.failed++;
  }

  // Test 9: Get related products
  if (firstProductId) {
    header('TEST 9: Get Related Products');
    const relatedTest = await testEndpoint(
      'GET /api/recommendations/related/:id',
      'GET',
      `/api/recommendations/related/${firstProductId}?limit=4`
    );
    stats.total++;
    if (relatedTest.success) {
      stats.passed++;
      info(`  Found ${relatedTest.data.products.length} related products`);
    } else {
      stats.failed++;
    }
  }

  // Test 10: Get trending products
  header('TEST 10: Get Trending Products');
  const trendingTest = await testEndpoint(
    'GET /api/recommendations/trending',
    'GET',
    '/api/recommendations/trending?limit=4'
  );
  stats.total++;
  if (trendingTest.success) {
    stats.passed++;
    info(`  Found ${trendingTest.data.products.length} trending products`);
  } else {
    stats.failed++;
  }

  // Test 11: Get orders
  header('TEST 11: Get User Orders');
  const ordersTest = await testEndpoint('GET /api/orders', 'GET', '/api/orders');
  stats.total++;
  if (ordersTest.success) {
    stats.passed++;
    info(`  Found ${ordersTest.data.length} orders`);
    if (ordersTest.data.length > 0) {
      info(`  First order: $${ordersTest.data[0].totalAmount} - Status: ${ordersTest.data[0].status}`);
    }
  } else {
    stats.failed++;
  }

  // Test 12: Get FAQs
  header('TEST 12: Get FAQs');
  const faqTest = await testEndpoint('GET /api/faq', 'GET', '/api/faq');
  stats.total++;
  if (faqTest.success) {
    stats.passed++;
    info(`  Found ${faqTest.data.length} FAQs`);
    if (faqTest.data.length > 0) {
      info(`  First FAQ: "${faqTest.data[0].question}"`);
    }
  } else {
    stats.failed++;
  }

  // Test 13: Chatbot send message
  header('TEST 13: Send Chatbot Message');
  const chatTest = await testEndpoint(
    'POST /api/chatbot/send',
    'POST',
    '/api/chatbot/send',
    { message: 'How do I create a shopping list?' }
  );
  stats.total++;
  if (chatTest.success) {
    stats.passed++;
    info(`  Bot response: "${chatTest.data.response.substring(0, 80)}..."`);
    if (chatTest.data.suggestions) {
      info(`  Got ${chatTest.data.suggestions.length} suggestions`);
    }
  } else {
    stats.failed++;
  }

  // Test 14: Get chat messages
  header('TEST 14: Get Chat History');
  const messagesTest = await testEndpoint(
    'GET /api/chatbot/messages',
    'GET',
    '/api/chatbot/messages'
  );
  stats.total++;
  if (messagesTest.success) {
    stats.passed++;
    info(`  Found ${messagesTest.data.length} messages in history`);
  } else {
    stats.failed++;
  }

  // Test 15: Delete the test list
  if (createdListId) {
    header('TEST 15: Delete Test List (Cleanup)');
    const deleteTest = await testEndpoint(
      'DELETE /api/lists/:id',
      'DELETE',
      `/api/lists/${createdListId}`
    );
    stats.total++;
    if (deleteTest.success) {
      stats.passed++;
      info(`  Successfully deleted test list`);
    } else {
      stats.failed++;
    }
  }

  // Summary
  header('TEST SUMMARY');
  log(`\nTotal Tests: ${stats.total}`, 'bold');
  log(`Passed: ${stats.passed}`, 'green');
  log(`Failed: ${stats.failed}`, 'red');

  const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
  log(`\nSuccess Rate: ${percentage}%`, percentage === '100.0' ? 'green' : 'yellow');

  if (stats.failed === 0) {
    log('\n🎉 All tests passed! Your API is working correctly!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
    log('Make sure MongoDB is running and the server is started.', 'yellow');
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return true;
  } catch (err) {
    return false;
  }
}

// Main execution
(async () => {
  log('\n🔍 Checking if server is running...', 'cyan');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    error('\n✗ Server is not running at ' + BASE_URL);
    log('\nPlease start the server first:', 'yellow');
    log('  npm run dev:win    (Windows)', 'yellow');
    log('  npm run dev        (Linux/Mac)', 'yellow');
    process.exit(1);
  }

  success('✓ Server is running!\n');

  await runTests();
})();
