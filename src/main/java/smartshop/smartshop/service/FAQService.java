package smartshop.smartshop.service;

import smartshop.smartshop.model.FAQ;

import java.util.List;

public interface FAQService {
    List<FAQ> listAll();
    FAQ create(FAQ faq);
    FAQ update(FAQ faq);
    void delete(String id);
}

