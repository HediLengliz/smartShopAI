package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.*;
import smartshop.smartshop.repository.CartRepository;
import smartshop.smartshop.repository.ProductRepository;
import smartshop.smartshop.service.CartService;

import java.util.ArrayList;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    @Override
    public Cart getOrCreateCart(String userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart c = new Cart();
            c.setUserId(userId);
            c.setItems(new ArrayList<>());
            c.setCreatedAt(new Date());
            c.setUpdatedAt(new Date());
            c.setTotalAmount(0);
            return cartRepository.save(c);
        });
    }

    @Override
    public Cart addItem(String userId, String productId, int quantity) {
        Cart cart = getOrCreateCart(userId);
        Product p = productRepository.findById(productId).orElseThrow();
        if (cart.getItems() == null) cart.setItems(new ArrayList<>());
        // find existing
        CartItem existing = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst().orElse(null);
        if (existing == null) {
            existing = new CartItem(productId, 0, p.getPrice(), 0);
            cart.getItems().add(existing);
        }
        existing.setQuantity(existing.getQuantity() + quantity);
        existing.setUnitPrice(p.getPrice());
        existing.setTotalPrice(existing.getQuantity() * existing.getUnitPrice());
        recalc(cart);
        cart.setUpdatedAt(new Date());
        return cartRepository.save(cart);
    }

    @Override
    public Cart removeItem(String userId, String productId) {
        Cart cart = getOrCreateCart(userId);
        if (cart.getItems() != null) {
            cart.getItems().removeIf(i -> i.getProductId().equals(productId));
        }
        recalc(cart);
        cart.setUpdatedAt(new Date());
        return cartRepository.save(cart);
    }

    @Override
    public Cart clear(String userId) {
        Cart cart = getOrCreateCart(userId);
        cart.setItems(new ArrayList<>());
        recalc(cart);
        cart.setUpdatedAt(new Date());
        return cartRepository.save(cart);
    }

    private void recalc(Cart cart) {
        double total = 0;
        if (cart.getItems() != null) {
            for (CartItem it : cart.getItems()) {
                it.setTotalPrice(it.getQuantity() * it.getUnitPrice());
                total += it.getTotalPrice();
            }
        }
        cart.setTotalAmount(total);
    }
}

