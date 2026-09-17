'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * How the add-to-cart buttons should behave, from Settings → Checkout.
 *
 * A context rather than a prop because `AddToCartButton` is rendered from product
 * cards, quick-view panels, the product page, wishlist rows and the mobile nav —
 * threading one boolean through every one of those call sites, and every future
 * one, is the kind of change that gets half-done and leaves the setting working
 * on some buttons but not others.
 *
 * The default is `false`, which is the behaviour that existed before the setting
 * did, so a tree rendered outside the provider — a test, a stray preview — keeps
 * working.
 */
type CartBehaviour = {
  /** After a successful add, navigate to /checkout instead of staying put. */
  redirectToCheckout: boolean;
};

const CartBehaviourContext = createContext<CartBehaviour>({ redirectToCheckout: false });

export function CartBehaviourProvider({
  redirectToCheckout,
  children,
}: {
  redirectToCheckout: boolean;
  children: ReactNode;
}) {
  return (
    <CartBehaviourContext.Provider value={{ redirectToCheckout }}>
      {children}
    </CartBehaviourContext.Provider>
  );
}

export function useCartBehaviour(): CartBehaviour {
  return useContext(CartBehaviourContext);
}
