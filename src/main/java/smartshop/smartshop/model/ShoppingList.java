package smartshop.smartshop.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lists")
public class ShoppingList {
    @Id
    private String id;

    private String userId;
    private String name;
    private List<ListItem> items;
    private Date createdAt;
    private Date updatedAt;
}

