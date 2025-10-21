package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.FAQ;
import smartshop.smartshop.repository.FAQRepository;
import smartshop.smartshop.service.FAQService;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FAQServiceImpl implements FAQService {

    private final FAQRepository faqRepository;

    @Override
    public List<FAQ> listAll() {
        return faqRepository.findAll();
    }

    @Override
    public FAQ create(FAQ faq) {
        faq.setCreatedAt(new Date());
        faq.setUpdatedAt(new Date());
        return faqRepository.save(faq);
    }

    @Override
    public FAQ update(FAQ faq) {
        faq.setUpdatedAt(new Date());
        return faqRepository.save(faq);
    }

    @Override
    public void delete(String id) {
        faqRepository.deleteById(id);
    }
}

