package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.Order;
import smartshop.smartshop.model.OrderItem;
import smartshop.smartshop.model.Product;
import smartshop.smartshop.repository.OrderRepository;
import smartshop.smartshop.repository.ProductRepository;
import smartshop.smartshop.service.RecommendationService;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ObjectProvider<ChatClient> chatClientProvider;

    @Override
    public List<Product> recommendForUser(String userId, int limit) {
        // Base heuristic: most frequently purchased items by this user
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        Map<String, Integer> freq = new HashMap<>();
        for (Order o : orders) {
            if (o.getItems() == null) continue;
            for (OrderItem it : o.getItems()) {
                freq.merge(it.getProductId(), it.getQuantity(), Integer::sum);
            }
        }
        List<String> candidateIds = freq.entrySet().stream()
                .sorted((a,b) -> Integer.compare(b.getValue(), a.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        if (candidateIds.isEmpty()) {
            // fallback to latest products
            return productRepository.findTop10ByOrderByCreatedAtDesc();
        }

        // If ChatClient available, ask it to re-rank; otherwise, return by freq
        ChatClient chatClient = chatClientProvider.getIfAvailable();
        List<String> topIds = candidateIds;
        if (chatClient != null) {
            try {
                String prompt = "Given product IDs with purchase frequencies: " + freq + ", return a comma-separated list of up to " + (limit > 0 ? limit : 10) + " product IDs most likely to be purchased next. Only return IDs.";
                String content = chatClient.prompt().user(u -> u.text(prompt)).call().content();
                if (content != null && !content.isBlank()) {
                    topIds = Arrays.stream(content.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                }
            } catch (Exception ignored) { }
        }
        if (limit > 0 && topIds.size() > limit) topIds = topIds.subList(0, limit);
        Map<String, Product> map = productRepository.findAllById(topIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        return topIds.stream().map(map::get).filter(Objects::nonNull).collect(Collectors.toList());
    }
}

