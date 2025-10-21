package smartshop.smartshop.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.model.Cart;
import smartshop.smartshop.service.CartService;

@RestController
@Tag(name = "Cart", description = "Cart operations")
@RequestMapping(path = "/api/cart", produces = "application/json")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    @Operation(summary = "Get cart for a user")
    @GetMapping("/{userId}")
    public Cart getCart(@PathVariable String userId) {
        return cartService.getOrCreateCart(userId);
    }
    @Operation(summary = "Add item to cart")
    @PostMapping(path = "/add", consumes = "application/json")

    public Cart add(@RequestParam String userId,
                    @RequestParam String productId,
                    @RequestParam int quantity) {
        return cartService.addItem(userId, productId, quantity);
    }
    @Operation(summary = "Remove item from cart")
    @PostMapping(path = "/remove", consumes = "application/json")
    public Cart remove(@RequestParam String userId,
                       @RequestParam String productId) {
        return cartService.removeItem(userId, productId);
    }

    @Operation(summary = "Clear user's cart")
    @PostMapping(path = "/clear", consumes = "application/json")
    public ResponseEntity<Void> clear(@RequestParam String userId) {
        cartService.clear(userId);
        return ResponseEntity.ok().build();
    }
}
