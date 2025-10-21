package smartshop.smartshop.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import smartshop.smartshop.model.Product;

import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByCategoryId(String categoryId);
    List<Product> findTop10ByOrderByCreatedAtDesc();
}

