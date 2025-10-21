package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.controller.dto.ProductDtos.*;
import smartshop.smartshop.model.Product;
import smartshop.smartshop.service.ProductService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody ProductRequest req) {
        Product p = new Product();
        p.setName(req.name());
        p.setDescription(req.description());
        p.setImageUrl(req.imageUrl());
        p.setPrice(req.price());
        p.setStockQuantity(req.stockQuantity());
        p.setCategoryId(req.categoryId());
        return ResponseEntity.ok(productService.create(p));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> get(@PathVariable String id) {
        Optional<Product> p = productService.get(id);
        return p.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable String id, @RequestBody ProductRequest req) {
        Optional<Product> existing = productService.get(id);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();
        Product p = existing.get();
        p.setName(req.name());
        p.setDescription(req.description());
        p.setImageUrl(req.imageUrl());
        p.setPrice(req.price());
        p.setStockQuantity(req.stockQuantity());
        p.setCategoryId(req.categoryId());
        return ResponseEntity.ok(productService.update(p));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<Product> search(@RequestParam(value = "q", required = false) String q) {
        return productService.search(q);
    }

    @GetMapping("/category/{categoryId}")
    public List<Product> byCategory(@PathVariable String categoryId) {
        return productService.byCategory(categoryId);
    }

    @GetMapping("/latest")
    public List<Product> latest(@RequestParam(defaultValue = "10") int limit) {
        return productService.latest(limit);
    }

    @GetMapping("/trending")
    public List<Product> trending(@RequestParam(defaultValue = "10") int limit) {
        return productService.trending(limit);
    }
}

