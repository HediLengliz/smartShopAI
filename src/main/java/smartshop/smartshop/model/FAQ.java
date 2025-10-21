package smartshop.smartshop.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "faqs")
public class FAQ {
    @Id
    private String id;

    private String question;
    private String answer;
    private Date createdAt;
    private Date updatedAt;
}

