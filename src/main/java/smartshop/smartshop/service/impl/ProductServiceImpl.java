package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.Order;
import smartshop.smartshop.model.OrderItem;
import smartshop.smartshop.model.Product;
import smartshop.smartshop.repository.OrderRepository;
import smartshop.smartshop.repository.ProductRepository;
import smartshop.smartshop.service.ProductService;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Override
    public Product create(Product product) {
        Date now = new Date();
        product.setCreatedAt(now);
        product.setUpdatedAt(now);
        return productRepository.save(product);
    }

    @Override
    public Optional<Product> get(String id) {
        return productRepository.findById(id);
    }

    @Override
    public Product update(Product product) {
        product.setUpdatedAt(new Date());
        return productRepository.save(product);
    }

    @Override
    public void delete(String id) {
        productRepository.deleteById(id);
    }

    @Override
    public List<Product> search(String query) {
        if (query == null || query.isBlank()) {
            return productRepository.findAll();
        }
        return productRepository.findByNameContainingIgnoreCase(query);
    }

    @Override
    public List<Product> byCategory(String categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    @Override
    public List<Product> latest(int limit) {
        List<Product> list = productRepository.findTop10ByOrderByCreatedAtDesc();
        if (limit > 0 && list.size() > limit) {
            return list.subList(0, limit);
        }
        return list;
    }

    @Override
    public List<Product> trending(int limit) {
        // Calculate by order frequency in the last 30 days
        Calendar cal = Calendar.getInstance();
        Date end = cal.getTime();
        cal.add(Calendar.DAY_OF_YEAR, -30);
        Date start = cal.getTime();
        List<Order> recent = orderRepository.findByOrderDateBetween(start, end);
        Map<String, Integer> freq = new HashMap<>();
        for (Order o : recent) {
            if (o.getItems() == null) continue;
            for (OrderItem it : o.getItems()) {
                freq.merge(it.getProductId(), it.getQuantity(), Integer::sum);
            }
        }
        List<String> topIds = freq.entrySet().stream()
                .sorted((a,b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(limit > 0 ? limit : 10)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        Map<String, Product> map = productRepository.findAllById(topIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        return topIds.stream().map(map::get).filter(Objects::nonNull).collect(Collectors.toList());
    }
}


