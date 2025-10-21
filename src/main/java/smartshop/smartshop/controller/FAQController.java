package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.model.FAQ;
import smartshop.smartshop.service.FAQService;

import java.util.List;

@RestController
@RequestMapping("/api/faqs")
@RequiredArgsConstructor
public class FAQController {

    private final FAQService faqService;

    @GetMapping
    public List<FAQ> all() { return faqService.listAll(); }

    @PostMapping
    public FAQ create(@RequestBody FAQ faq) { return faqService.create(faq); }

    @PutMapping
    public FAQ update(@RequestBody FAQ faq) { return faqService.update(faq); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) { faqService.delete(id); return ResponseEntity.noContent().build(); }
}

