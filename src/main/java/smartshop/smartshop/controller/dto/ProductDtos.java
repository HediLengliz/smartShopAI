package smartshop.smartshop.controller.dto;

import java.util.List;

public class ProductDtos {
    public record ProductRequest(String name, String description, String imageUrl, double price, int stockQuantity, String categoryId) {}
    public record ProductIds(List<String> ids) {}
}
