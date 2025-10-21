package smartshop.smartshop.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import smartshop.smartshop.model.Category;

import java.util.List;

public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByActive(boolean active);
}

