package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.model.Product;
import smartshop.smartshop.service.RecommendationService;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/{userId}")
    public List<Product> recommend(@PathVariable String userId, @RequestParam(defaultValue = "10") int limit) {
        return recommendationService.recommendForUser(userId, limit);
    }
}

