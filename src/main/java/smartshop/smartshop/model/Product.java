package smartshop.smartshop.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "products")
public class Product {
    @Id
    private String id;

    @Indexed
    private String name;
    private String description;
    private String imageUrl;
    private double price;
    private int stockQuantity;
    private String categoryId;
    private Date createdAt;
    private Date updatedAt;
}

