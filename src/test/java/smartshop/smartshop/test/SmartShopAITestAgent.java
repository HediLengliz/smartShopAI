package smartshop.smartshop.test;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import smartshop.smartshop.model.*;
import smartshop.smartshop.repository.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive AI Agent Test Suite for SmartShop
 * Tests REST APIs, business logic, and data persistence
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@ActiveProfiles("test")
public class SmartShopAITestAgent {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ShoppingListRepository shoppingListRepository;

    private String baseUrl;
    private static final Map<String, Object> testResults = new LinkedHashMap<>();
    private static final List<String> testLogs = new ArrayList<>();

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port;
    }

    @AfterAll
    static void printTestReport() {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("SMARTSHOP AI TEST AGENT - DETAILED RESULTS");
        System.out.println("=".repeat(80));
        System.out.println("Test Execution Time: " + new Date());
        System.out.println("Total Tests: " + testResults.size());

        long passed = testResults.values().stream().filter(v -> v.equals("PASS")).count();
        long failed = testResults.values().stream().filter(v -> v.equals("FAIL")).count();

        System.out.println("Passed: " + passed);
        System.out.println("Failed: " + failed);
        System.out.println("Success Rate: " + String.format("%.2f%%", (passed * 100.0 / testResults.size())));
        System.out.println("\n" + "-".repeat(80));
        System.out.println("DETAILED TEST RESULTS:");
        System.out.println("-".repeat(80));

        testResults.forEach((test, result) -> {
            String status = result.equals("PASS") ? "✓" : "✗";
            System.out.println(status + " " + test + ": " + result);
        });

        if (!testLogs.isEmpty()) {
            System.out.println("\n" + "-".repeat(80));
            System.out.println("TEST LOGS:");
            System.out.println("-".repeat(80));
            testLogs.forEach(System.out::println);
        }

        System.out.println("\n" + "=".repeat(80));
    }

    private void recordTest(String testName, boolean passed, String details) {
        testResults.put(testName, passed ? "PASS" : "FAIL");
        if (details != null && !details.isEmpty()) {
            testLogs.add(testName + ": " + details);
        }
    }

    // ==================== DATABASE & REPOSITORY TESTS ====================

    @Test
    @org.junit.jupiter.api.Order(1)
    void test01_DatabaseConnection() {
        try {
            userRepository.count();
            productRepository.count();
            recordTest("Database Connection", true, "MongoDB connected successfully");
        } catch (Exception e) {
            recordTest("Database Connection", false, "Error: " + e.getMessage());
            fail("Database connection failed");
        }
    }

    @Test
    @org.junit.jupiter.api.Order(2)
    void test02_UserRepositoryCRUD() {
        try {
            User user = new User();
            user.setEmail("test@smartshop.com");
            user.setFirstName("Test");
            user.setLastName("User");
            user.setPassword("password123");
            user.setActive(true);
            user.setCreatedAt(new Date());

            User saved = userRepository.save(user);
            assertNotNull(saved.getId());

            Optional<User> found = userRepository.findByEmail("test@smartshop.com");
            assertTrue(found.isPresent());

            recordTest("User Repository CRUD", true, "User created with ID: " + saved.getId());
        } catch (Exception e) {
            recordTest("User Repository CRUD", false, "Error: " + e.getMessage());
            fail(e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(3)
    void test03_ProductRepositoryCRUD() {
        try {
            Product product = new Product();
            product.setName("Test Laptop");
            product.setDescription("High-performance laptop");
            product.setPrice(999.99);
            product.setStockQuantity(10);
            product.setCreatedAt(new Date());

            Product saved = productRepository.save(product);
            assertNotNull(saved.getId());

            List<Product> found = productRepository.findByNameContainingIgnoreCase("laptop");
            assertFalse(found.isEmpty());

            recordTest("Product Repository CRUD", true, "Product created: " + saved.getName());
        } catch (Exception e) {
            recordTest("Product Repository CRUD", false, "Error: " + e.getMessage());
            fail(e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(4)
    void test04_CategoryRepositoryCRUD() {
        try {
            Category category = new Category();
            category.setName("Test Electronics");
            category.setDescription("Electronic gadgets and devices");

            Category saved = categoryRepository.save(category);
            assertNotNull(saved.getId());

            Optional<Category> found = categoryRepository.findById(saved.getId());
            assertTrue(found.isPresent());
            assertEquals("Test Electronics", found.get().getName());

            recordTest("Category Repository CRUD", true, "Category created with ID: " + saved.getId());
        } catch (Exception e) {
            recordTest("Category Repository CRUD", false, "Error: " + e.getMessage());
            fail(e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(5)
    void test05_ShoppingListRepositoryCRUD() {
        try {
            ShoppingList list = new ShoppingList();
            list.setUserId("user-for-list-test");
            list.setName("My Test Wishlist");

            ShoppingList saved = shoppingListRepository.save(list);
            assertNotNull(saved.getId());

            List<ShoppingList> found = shoppingListRepository.findByUserIdOrderByUpdatedAtDesc("user-for-list-test");
            assertFalse(found.isEmpty());

            recordTest("ShoppingList Repository CRUD", true, "ShoppingList created with ID: " + saved.getId());
        } catch (Exception e) {
            recordTest("ShoppingList Repository CRUD", false, "Error: " + e.getMessage());
            fail(e.getMessage());
        }
    }

    // ==================== REST API TESTS ====================

    @Test
    @org.junit.jupiter.api.Order(10)
    void test10_ProductsAPI_GetAll() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/api/products", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("GET /api/products", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("GET /api/products", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(11)
    void test11_ProductsAPI_Create() {
        try {
            Map<String, Object> productRequest = new HashMap<>();
            productRequest.put("name", "AI Test Product");
            productRequest.put("description", "Created by AI test agent");
            productRequest.put("price", 299.99);
            productRequest.put("stockQuantity", 5);
            productRequest.put("imageUrl", "https://example.com/test.jpg");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(productRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/products", request, String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("POST /api/products", passed,
                "Status: " + response.getStatusCode() + ", Response: " + response.getBody());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("POST /api/products", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(12)
    void test12_CartAPI_GetOrCreate() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/api/cart/test-user-123", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("GET /api/cart/{userId}", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("GET /api/cart/{userId}", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(13)
    void test13_CartAPI_AddItem() {
        try {
            // First create a product
            Product product = new Product();
            product.setName("Cart Test Product");
            product.setPrice(50.0);
            product.setStockQuantity(100);
            Product saved = productRepository.save(product);

            Map<String, Object> addRequest = new HashMap<>();
            addRequest.put("userId", "test-user-cart");
            addRequest.put("productId", saved.getId());
            addRequest.put("quantity", 2);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(addRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/cart/add", request, String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("POST /api/cart/add", passed,
                "Added product " + saved.getId() + " to cart, Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("POST /api/cart/add", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(14)
    void test14_OrdersAPI_Create() {
        try {
            // Setup: Create product and add to cart
            Product product = new Product();
            product.setName("Order Test Product");
            product.setPrice(100.0);
            product.setStockQuantity(50);
            Product saved = productRepository.save(product);

            Cart cart = new Cart();
            cart.setUserId("test-order-user");
            cart.setItems(List.of(new CartItem(saved.getId(), 1, 100.0, 100.0)));
            cart.setTotalAmount(100.0);
            cartRepository.save(cart);

            Map<String, Object> orderRequest = new HashMap<>();
            orderRequest.put("userId", "test-order-user");
            orderRequest.put("shippingAddress", "123 Test St");
            orderRequest.put("paymentMethod", "stripe");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(orderRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/orders", request, String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("POST /api/orders", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("POST /api/orders", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(15)
    void test15_FAQsAPI_GetAll() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/api/faqs", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("GET /api/faqs", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("GET /api/faqs", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(16)
    void test16_ShoppingListAPI_Create() {
        try {
            Map<String, Object> listRequest = new HashMap<>();
            listRequest.put("userId", "api-user-test");
            listRequest.put("name", "API Test List");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(listRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/lists", request, String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("POST /api/lists", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("POST /api/lists", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(17)
    void test17_ShoppingListAPI_AddItem() {
        try {
            // Setup: Create a product and a shopping list
            Product product = new Product();
            product.setName("List Item Product");
            product.setPrice(25.0);
            product.setStockQuantity(200);
            Product savedProduct = productRepository.save(product);

            ShoppingList list = new ShoppingList();
            list.setUserId("list-item-user");
            list.setName("My List");
            ShoppingList savedList = shoppingListRepository.save(list);

            Map<String, Object> itemRequest = new HashMap<>();
            itemRequest.put("productId", savedProduct.getId());
            itemRequest.put("quantity", 3);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(itemRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/lists/" + savedList.getId() + "/items", request, String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("POST /api/lists/{listId}/items", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("POST /api/lists/{listId}/items", false, "Error: " + e.getMessage());
        }
    }

    // ==================== UI ENDPOINTS TESTS ====================

    @Test
    @org.junit.jupiter.api.Order(20)
    void test20_UI_HomePage() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/ui", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("GET /ui (Home)", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("GET /ui (Home)", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(21)
    void test21_UI_ProductsPage() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/ui/products", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("GET /ui/products", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("GET /ui/products", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(22)
    void test22_UI_CartPage() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/ui/cart/test-ui-user", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("GET /ui/cart/{userId}", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("GET /ui/cart/{userId}", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(23)
    void test23_UI_FAQsPage() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/ui/faqs", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("GET /ui/faqs", passed, "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("GET /ui/faqs", false, "Error: " + e.getMessage());
        }
    }

    // ==================== SWAGGER/OPENAPI TESTS ====================

    @Test
    @org.junit.jupiter.api.Order(30)
    void test30_SwaggerUI_Available() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/swagger-ui.html", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful() ||
                           response.getStatusCode() == HttpStatus.FOUND;
            recordTest("Swagger UI /swagger-ui.html", passed, "Status: " + response.getStatusCode());
        } catch (Exception e) {
            recordTest("Swagger UI /swagger-ui.html", false, "Error: " + e.getMessage());
        }
    }

    @Test
    @org.junit.jupiter.api.Order(31)
    void test31_OpenAPI_Docs() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/v3/api-docs/smartshop-api", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("OpenAPI Docs /v3/api-docs", passed,
                "Status: " + response.getStatusCode());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("OpenAPI Docs /v3/api-docs", false, "Error: " + e.getMessage());
        }
    }

    // ==================== ACTUATOR HEALTH TESTS ====================

    @Test
    @org.junit.jupiter.api.Order(40)
    void test40_ActuatorHealth() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                baseUrl + "/actuator/health", String.class);

            boolean passed = response.getStatusCode().is2xxSuccessful();
            recordTest("Actuator Health", passed,
                "Status: " + response.getStatusCode() + ", Body: " + response.getBody());
            assertTrue(passed);
        } catch (Exception e) {
            recordTest("Actuator Health", false, "Error: " + e.getMessage());
        }
    }
}
