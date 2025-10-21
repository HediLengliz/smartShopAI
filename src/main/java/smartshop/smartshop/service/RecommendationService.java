package smartshop.smartshop.service;

import smartshop.smartshop.model.Product;

import java.util.List;

public interface RecommendationService {
    List<Product> recommendForUser(String userId, int limit);
}

