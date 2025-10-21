package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.model.Product;
import smartshop.smartshop.service.*;

import java.util.Optional;

@Controller
@RequestMapping("/ui")
@RequiredArgsConstructor
public class UiController {

    private final ProductService productService;
    private final CartService cartService;
    private final OrderService orderService;
    private final FAQService faqService;
    private final ShoppingListService shoppingListService;

    @GetMapping({"/", ""})
    public String home(Model model) {
        model.addAttribute("latest", productService.latest(8));
        model.addAttribute("trending", productService.trending(8));
        return "index";
    }

    @GetMapping("/products")
    public String products(@RequestParam(value = "q", required = false) String q, Model model) {
        model.addAttribute("query", q);
        model.addAttribute("products", productService.search(q));
        return "products";
    }

    @GetMapping("/product/{id}")
    public String product(@PathVariable String id, Model model) {
        Optional<Product> p = productService.get(id);
        if (p.isEmpty()) return "redirect:/ui/products";
        model.addAttribute("product", p.get());
        return "product";
    }

    @GetMapping("/cart/{userId}")
    public String cart(@PathVariable String userId, Model model) {
        model.addAttribute("cart", cartService.getOrCreateCart(userId));
        model.addAttribute("userId", userId);
        return "cart";
    }

    @GetMapping("/orders/{userId}")
    public String orders(@PathVariable String userId, Model model) {
        model.addAttribute("orders", orderService.history(userId));
        model.addAttribute("userId", userId);
        return "orders";
    }

    @GetMapping("/faqs")
    public String faqs(Model model) {
        model.addAttribute("faqs", faqService.listAll());
        return "faqs";
    }

    @GetMapping("/lists/{userId}")
    public String lists(@PathVariable String userId, Model model) {
        model.addAttribute("lists", shoppingListService.getUserLists(userId));
        model.addAttribute("userId", userId);
        return "lists";
    }
}

