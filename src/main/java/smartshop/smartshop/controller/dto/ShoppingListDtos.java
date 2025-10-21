package smartshop.smartshop.controller.dto;

import smartshop.smartshop.model.ListItem;

public class ShoppingListDtos {
    public record CreateListRequest(String userId, String name) {}
    public record RenameListRequest(String listId, String newName) {}
    public record ItemUpdateRequest(String listId, int index, ListItem item) {}
}

