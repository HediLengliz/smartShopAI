package smartshop.smartshop.service;

import smartshop.smartshop.model.Cart;

public interface CartService {
    Cart getOrCreateCart(String userId);
    Cart addItem(String userId, String productId, int quantity);
    Cart removeItem(String userId, String productId);
    Cart clear(String userId);
}

