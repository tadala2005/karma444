
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  kind: "PRODUCT" | "TICKET";
  id: string;
  slug: string;
  title: string;
  image: string;
  unitPrice: number;
  quantity: number;
  size?: string;
  color?: string;
};

type Store = {
  items: CartItem[];

  add: (item: CartItem) => void;

  remove: (
    id: string,
    kind: CartItem["kind"],
    size?: string,
    color?: string
  ) => void;

  quantity: (
    id: string,
    kind: CartItem["kind"],
    size: string | undefined,
    color: string | undefined,
    quantity: number
  ) => void;

  clear: () => void;
};

export const useCart = create<Store>()(
  persist(
    set => ({
      items: [],

      add: item =>
        set(state => {
          const index = state.items.findIndex(
            existing =>
              existing.id === item.id &&
              existing.kind === item.kind &&
              existing.size === item.size &&
              existing.color === item.color
          );

          if (index < 0) {
            return {
              items: [...state.items, item]
            };
          }

          return {
            items: state.items.map(
              (existing, i) =>
                i === index
                  ? {
                      ...existing,
                      quantity: Math.min(
                        10,
                        existing.quantity +
                          item.quantity
                      )
                    }
                  : existing
            )
          };
        }),

      remove: (id, kind, size, color) =>
        set(state => ({
          items: state.items.filter(
            item =>
              !(
                item.id === id &&
                item.kind === kind &&
                item.size === size &&
                item.color === color
              )
          )
        })),

      quantity: (
        id,
        kind,
        size,
        color,
        quantity
      ) =>
        set(state => ({
          items: state.items.map(item =>
            item.id === id &&
            item.kind === kind &&
            item.size === size &&
            item.color === color
              ? {
                  ...item,
                  quantity: Math.max(
                    1,
                    Math.min(10, quantity)
                  )
                }
              : item
          )
        })),

      clear: () => set({ items: [] })
    }),
    {
      name: "karma-cart-v2"
    }
  )
);
