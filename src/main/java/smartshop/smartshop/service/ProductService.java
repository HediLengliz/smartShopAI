package smartshop.smartshop.service;

import smartshop.smartshop.model.Product;

import java.util.List;
import java.util.Optional;

/**
 * Product service contract for CRUD, search, latest, category filter, and trending products.
 */
public interface ProductService {
    /** Create a new product. */
    Product create(Product product);

    /** Get a product by id. */
    Optional<Product> get(String id);

    /** Update an existing product. */
    Product update(Product product);

    /** Delete a product by id. */
    void delete(String id);

    /** Search products by name (case-insensitive); empty query returns all. */
    List<Product> search(String query);

    /** List products for a category id. */
    List<Product> byCategory(String categoryId);

    /** Latest products, limited by 'limit' (default repo returns top 10). */
    List<Product> latest(int limit);

    /** Trending products computed from recent order frequency. */
    List<Product> trending(int limit);
}

