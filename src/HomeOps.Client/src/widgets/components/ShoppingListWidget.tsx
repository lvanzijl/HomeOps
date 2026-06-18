import { FormEvent, useState } from 'react';
import { demoShoppingListItems } from '../../demo/demoShoppingListData';
import { addShoppingListItem, getActiveShoppingListItems, getCompletedShoppingListItems, removeShoppingListItem, toggleShoppingListItem } from '../../shopping/shoppingListState';
import type { ShoppingListItem } from '../../shopping/shoppingListModel';
import type { WidgetRenderProps } from '../WidgetRenderer';

export function ShoppingListWidget({ instance }: WidgetRenderProps) {
  const [items, setItems] = useState<readonly ShoppingListItem[]>(demoShoppingListItems);
  const [newItemLabel, setNewItemLabel] = useState('');

  const activeItems = getActiveShoppingListItems(items);
  const completedItems = getCompletedShoppingListItems(items);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setItems((current) => addShoppingListItem(current, newItemLabel));
    setNewItemLabel('');
  }

  return (
    <article className="widget-card shopping-widget" aria-label={instance.title}>
      <p className="widget-type">Shopping List Widget</p>
      <h3>{instance.title}</h3>
      <form className="shopping-add-form" onSubmit={addItem}>
        <label>
          <span className="visually-hidden">New shopping item</span>
          <input
            onChange={(event) => setNewItemLabel(event.target.value)}
            placeholder="Add an item"
            type="text"
            value={newItemLabel}
          />
        </label>
        <button type="submit">Add</button>
      </form>
      <ShoppingListSection
        emptyLabel="No active items."
        items={activeItems}
        onRemove={(itemId) => setItems((current) => removeShoppingListItem(current, itemId))}
        onToggle={(itemId) => setItems((current) => toggleShoppingListItem(current, itemId))}
        title="Active"
      />
      <ShoppingListSection
        emptyLabel="No completed items."
        items={completedItems}
        onRemove={(itemId) => setItems((current) => removeShoppingListItem(current, itemId))}
        onToggle={(itemId) => setItems((current) => toggleShoppingListItem(current, itemId))}
        title="Completed"
      />
    </article>
  );
}

interface ShoppingListSectionProps {
  emptyLabel: string;
  items: readonly ShoppingListItem[];
  onRemove(itemId: string): void;
  onToggle(itemId: string): void;
  title: string;
}

function ShoppingListSection({ emptyLabel, items, onRemove, onToggle, title }: ShoppingListSectionProps) {
  return (
    <section className="shopping-section">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="shopping-empty">{emptyLabel}</p>
      ) : (
        <ul className="shopping-list">
          {items.map((item) => (
            <li className="shopping-item" key={item.id}>
              <label>
                <input checked={item.completed} onChange={() => onToggle(item.id)} type="checkbox" />
                <span>{item.label}</span>
              </label>
              <button onClick={() => onRemove(item.id)} type="button">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
