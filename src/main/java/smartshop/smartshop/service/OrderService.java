package smartshop.smartshop.service;

import smartshop.smartshop.model.Order;

import java.util.List;
import java.util.Optional;

/**
 * Order service contract for creating orders from cart, fetching details, history, and updating status.
 */
public interface OrderService {
    /**
     * Create an order from the current user's cart.
     * @param userId user identifier owning the cart
     * @param shippingAddress shipping address for delivery
     * @param paymentMethod preferred payment method label (e.g., "stripe")
     * @return persisted Order
     * @throws IllegalStateException if the cart is empty
     */
    Order createOrderFromCart(String userId, String shippingAddress, String paymentMethod);

    /** Get an order by id. */
    Optional<Order> get(String id);

    /** Get order history for a user, most recent first. */
    List<Order> history(String userId);

    /** Update status of an order. */
    Order updateStatus(String orderId, String status);
}

