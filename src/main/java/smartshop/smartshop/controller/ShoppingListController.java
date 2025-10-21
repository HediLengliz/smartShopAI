package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.controller.dto.ShoppingListDtos.*;
import smartshop.smartshop.model.ListItem;
import smartshop.smartshop.model.ShoppingList;
import smartshop.smartshop.service.ShoppingListService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService listService;

    @PostMapping
    public ShoppingList create(@RequestBody CreateListRequest req) {
        return listService.createList(req.userId(), req.name());
    }

    @GetMapping("/{listId}")
    public ResponseEntity<ShoppingList> get(@PathVariable String listId) {
        Optional<ShoppingList> list = listService.getList(listId);
        return list.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<ShoppingList> userLists(@PathVariable String userId) {
        return listService.getUserLists(userId);
    }

    @PostMapping("/rename")
    public ShoppingList rename(@RequestBody RenameListRequest req) {
        return listService.renameList(req.listId(), req.newName());
    }

    @DeleteMapping("/{listId}")
    public ResponseEntity<Void> delete(@PathVariable String listId) {
        listService.deleteList(listId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/item")
    public ShoppingList addItem(@RequestBody ItemUpdateRequest req) {
        return listService.addItem(req.listId(), req.item());
    }

    @PutMapping("/item")
    public ShoppingList updateItem(@RequestBody ItemUpdateRequest req) {
        return listService.updateItem(req.listId(), req.index(), req.item());
    }

    @DeleteMapping("/item")
    public ShoppingList removeItem(@RequestBody ItemUpdateRequest req) {
        return listService.removeItem(req.listId(), req.index());
    }
}

