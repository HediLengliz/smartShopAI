package smartshop.smartshop.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListItem {
    private String productId;
    private String name;
    private int quantity;
    private String unit; // e.g., kg, pcs
    private String status; // PENDING, BOUGHT, REMOVED
}

