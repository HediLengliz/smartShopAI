package smartshop.smartshop.service;

import smartshop.smartshop.model.ListItem;
import smartshop.smartshop.model.ShoppingList;

import java.util.List;
import java.util.Optional;

public interface ShoppingListService {
    ShoppingList createList(String userId, String name);
    Optional<ShoppingList> getList(String listId);
    List<ShoppingList> getUserLists(String userId);
    ShoppingList renameList(String listId, String newName);
    void deleteList(String listId);

    ShoppingList addItem(String listId, ListItem item);
    ShoppingList updateItem(String listId, int index, ListItem item);
    ShoppingList removeItem(String listId, int index);
}

