package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.ListItem;
import smartshop.smartshop.model.ShoppingList;
import smartshop.smartshop.repository.ShoppingListRepository;
import smartshop.smartshop.service.ShoppingListService;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ShoppingListServiceImpl implements ShoppingListService {

    private final ShoppingListRepository listRepository;

    @Override
    public ShoppingList createList(String userId, String name) {
        ShoppingList list = new ShoppingList();
        list.setUserId(userId);
        list.setName(name);
        list.setItems(new ArrayList<>());
        list.setCreatedAt(new Date());
        list.setUpdatedAt(new Date());
        return listRepository.save(list);
    }

    @Override
    public Optional<ShoppingList> getList(String listId) {
        return listRepository.findById(listId);
    }

    @Override
    public List<ShoppingList> getUserLists(String userId) {
        return listRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Override
    public ShoppingList renameList(String listId, String newName) {
        ShoppingList list = listRepository.findById(listId).orElseThrow();
        list.setName(newName);
        list.setUpdatedAt(new Date());
        return listRepository.save(list);
    }

    @Override
    public void deleteList(String listId) {
        listRepository.deleteById(listId);
    }

    @Override
    public ShoppingList addItem(String listId, ListItem item) {
        ShoppingList list = listRepository.findById(listId).orElseThrow();
        if (list.getItems() == null) list.setItems(new ArrayList<>());
        list.getItems().add(item);
        list.setUpdatedAt(new Date());
        return listRepository.save(list);
    }

    @Override
    public ShoppingList updateItem(String listId, int index, ListItem item) {
        ShoppingList list = listRepository.findById(listId).orElseThrow();
        if (list.getItems() == null || index < 0 || index >= list.getItems().size()) throw new IndexOutOfBoundsException("Item index out of range");
        list.getItems().set(index, item);
        list.setUpdatedAt(new Date());
        return listRepository.save(list);
    }

    @Override
    public ShoppingList removeItem(String listId, int index) {
        ShoppingList list = listRepository.findById(listId).orElseThrow();
        if (list.getItems() == null || index < 0 || index >= list.getItems().size()) throw new IndexOutOfBoundsException("Item index out of range");
        list.getItems().remove(index);
        list.setUpdatedAt(new Date());
        return listRepository.save(list);
    }
}

